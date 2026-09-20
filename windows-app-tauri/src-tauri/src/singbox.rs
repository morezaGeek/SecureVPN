use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use crate::state::{VpnLog, VpnState, VpnStats};

fn strip_ansi_codes(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut in_escape = false;
    for c in s.chars() {
        if c == '\x1b' {
            in_escape = true;
        } else if in_escape {
            if c.is_ascii_alphabetic() {
                in_escape = false;
            }
        } else {
            result.push(c);
        }
    }
    result
}

pub fn sanitize_domain(raw: &str) -> String {
    let mut s = raw.trim().to_lowercase();
    if s.starts_with("https://") {
        s = s[8..].to_string();
    } else if s.starts_with("http://") {
        s = s[7..].to_string();
    }
    if let Some(idx) = s.find('/') {
        s = s[..idx].to_string();
    }
    if let Some(idx) = s.find(':') {
        s = s[..idx].to_string();
    }
    while s.starts_with('*') || s.starts_with('.') {
        s = s.trim_start_matches('*').trim_start_matches('.').to_string();
    }
    s.trim().to_string()
}

pub async fn resolve_hostname_to_ip(host: &str) -> String {
    if host.parse::<std::net::IpAddr>().is_ok() {
        return host.to_string();
    }

    let addr_str = format!("{}:443", host);
    if let Ok(addrs) = tokio::net::lookup_host(&addr_str).await {
        for addr in addrs {
            if addr.is_ipv4() {
                return addr.ip().to_string();
            }
        }
    }

    host.to_string()
}

pub async fn build_singbox_outbound(profile: &Value) -> Result<(String, String, Value), String> {
    build_singbox_outbound_with_tag(profile, "proxy").await
}

pub async fn build_singbox_outbound_with_tag(profile: &Value, tag: &str) -> Result<(String, String, Value), String> {
    let protocol = profile.get("protocol").and_then(|v| v.as_str()).unwrap_or("vless");
    let raw_server_address = profile.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("127.0.0.1");
    let port = profile.get("port").and_then(|v| v.as_u64()).unwrap_or(443);
    let singbox_cfg = profile.get("singboxConfig").cloned().unwrap_or(json!({}));

    // Pre-resolve hostname to IPv4 to prevent sing-box circular DNS query loopback
    let server_ip = resolve_hostname_to_ip(raw_server_address).await;

    let uuid = singbox_cfg.get("uuid").and_then(|v| v.as_str()).unwrap_or("");
    let transport = singbox_cfg.get("transport").and_then(|v| v.as_str()).unwrap_or("tcp");
    let security = singbox_cfg.get("security").and_then(|v| v.as_str()).unwrap_or("none");
    let sni = singbox_cfg.get("sni").and_then(|v| v.as_str()).unwrap_or(raw_server_address);
    let fingerprint = singbox_cfg.get("fingerprint").and_then(|v| v.as_str()).unwrap_or("chrome");

    // Build outbound based on protocol
    let mut outbound = match protocol {
        "vless" => {
            let mut o = json!({
                "type": "vless",
                "tag": tag,
                "server": server_ip,
                "server_port": port,
                "uuid": uuid
            });
            if transport != "ws" && transport != "httpupgrade" && transport != "xhttp" {
                o["packet_encoding"] = json!("xudp");
            }
            o
        }
        "vmess" => {
            let mut o = json!({
                "type": "vmess",
                "tag": tag,
                "server": server_ip,
                "server_port": port,
                "uuid": uuid,
                "security": singbox_cfg.get("encryption").and_then(|v| v.as_str()).unwrap_or("auto"),
                "alter_id": 0
            });
            if transport != "ws" && transport != "httpupgrade" && transport != "xhttp" {
                o["packet_encoding"] = json!("xudp");
            }
            o
        }
        "trojan" => json!({
            "type": "trojan",
            "tag": tag,
            "server": server_ip,
            "server_port": port,
            "password": uuid
        }),
        "shadowsocks" => json!({
            "type": "shadowsocks",
            "tag": tag,
            "server": server_ip,
            "server_port": port,
            "password": uuid,
            "method": singbox_cfg.get("method").and_then(|v| v.as_str()).unwrap_or("aes-256-gcm")
        }),
        _ => return Err(format!("Unsupported singbox protocol: {}", protocol)),
    };

    // TLS / Reality config
    if security == "tls" || security == "reality" {
        let mut tls_obj = json!({
            "enabled": true,
            "server_name": sni,
            "utls": {
                "enabled": true,
                "fingerprint": fingerprint
            }
        });

        if security == "tls" {
            let alpn = if transport == "ws" || transport == "httpupgrade" {
                vec!["http/1.1"]
            } else if transport == "xhttp" || transport == "grpc" {
                vec!["h2"]
            } else {
                vec!["h2", "http/1.1"]
            };
            tls_obj["alpn"] = json!(alpn);
        }

        if security == "reality" {
            if let Some(pub_key) = singbox_cfg.get("publicKey").and_then(|v| v.as_str()) {
                tls_obj["reality"] = json!({
                    "enabled": true,
                    "public_key": pub_key,
                    "short_id": singbox_cfg.get("shortId").and_then(|v| v.as_str()).unwrap_or("")
                });
            }
        }

        outbound["tls"] = tls_obj;
    }

    // Transport config
    let host = singbox_cfg.get("host").and_then(|v| v.as_str()).unwrap_or(sni);

    if transport == "ws" {
        outbound["transport"] = json!({
            "type": "ws",
            "path": singbox_cfg.get("path").and_then(|v| v.as_str()).unwrap_or("/"),
            "headers": {
                "Host": host
            },
            "max_early_data": 2048,
            "early_data_header_name": "Sec-WebSocket-Protocol"
        });
    } else if transport == "httpupgrade" {
        outbound["transport"] = json!({
            "type": "httpupgrade",
            "path": singbox_cfg.get("path").and_then(|v| v.as_str()).unwrap_or("/"),
            "host": host
        });
    } else if transport == "xhttp" {
        outbound["transport"] = json!({
            "type": "xhttp",
            "mode": singbox_cfg.get("mode").and_then(|v| v.as_str()).unwrap_or("auto"),
            "path": singbox_cfg.get("path").and_then(|v| v.as_str()).unwrap_or("/"),
            "host": host
        });
    } else if transport == "grpc" {
        outbound["transport"] = json!({
            "type": "grpc",
            "service_name": singbox_cfg.get("serviceName").and_then(|v| v.as_str()).unwrap_or("")
        });
    }

    Ok((raw_server_address.to_string(), server_ip, outbound))
}

pub async fn build_singbox_batch_test_config(
    profiles: &[Value],
    config_path: &Path,
    clash_api_port: u16,
) -> Result<Vec<(String, String)>, String> {
    let mut outbounds = Vec::new();
    let mut tag_map = Vec::new();
    let mut direct_rules = Vec::new();

    for (i, p) in profiles.iter().enumerate() {
        let protocol = p.get("protocol").and_then(|v| v.as_str()).unwrap_or("");
        if !["vless", "vmess", "trojan", "shadowsocks"].contains(&protocol) {
            continue;
        }

        let id = p.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let tag = format!("proxy-{}", i);

        match build_singbox_outbound_with_tag(p, &tag).await {
            Ok((raw_addr, server_ip, outbound)) => {
                direct_rules.push(json!({ "domain": [raw_addr], "outbound": "direct" }));
                if server_ip.parse::<std::net::IpAddr>().is_ok() {
                    direct_rules.push(json!({ "ip_cidr": [format!("{}/32", server_ip)], "outbound": "direct" }));
                }
                outbounds.push(outbound);
                tag_map.push((id, tag));
            }
            Err(e) => {
                eprintln!("[BatchTestConfig] Failed to build outbound for profile {}: {}", id, e);
            }
        }
    }

    if outbounds.is_empty() {
        return Err("No valid sing-box profiles to test".into());
    }

    outbounds.push(json!({ "type": "direct", "tag": "direct" }));

    let full_config = json!({
        "log": {
            "level": "warn",
            "timestamp": true
        },
        "dns": {
            "servers": [
                {
                    "type": "local",
                    "tag": "direct-dns"
                }
            ],
            "strategy": "ipv4_only"
        },
        "inbounds": [
            {
                "type": "mixed",
                "tag": "mixed-in",
                "listen": "127.0.0.1",
                "listen_port": clash_api_port + 100
            }
        ],
        "outbounds": outbounds,
        "route": {
            "default_domain_resolver": "direct-dns",
            "rules": direct_rules,
            "final": "direct"
        },
        "experimental": {
            "clash_api": {
                "external_controller": format!("127.0.0.1:{}", clash_api_port)
            }
        }
    });

    let config_str = serde_json::to_string_pretty(&full_config).map_err(|e| e.to_string())?;
    std::fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    Ok(tag_map)
}

#[allow(dead_code)]
pub async fn build_singbox_test_config(profile: &Value, config_path: &Path) -> Result<(), String> {
    let (raw_server_address, server_ip, outbound) = build_singbox_outbound(profile).await?;

    let full_config = json!({
        "log": {
            "level": "error",
            "timestamp": true
        },
        "dns": {
            "servers": [
                {
                    "type": "local",
                    "tag": "direct-dns"
                }
            ],
            "strategy": "ipv4_only"
        },
        "outbounds": [
            outbound,
            { "type": "direct", "tag": "direct" }
        ],
        "route": {
            "default_domain_resolver": "direct-dns",
            "rules": [
                { "domain": [raw_server_address], "outbound": "direct" },
                { "ip_cidr": [format!("{}/32", server_ip)], "outbound": "direct" }
            ],
            "final": "proxy"
        }
    });

    let config_str = serde_json::to_string_pretty(&full_config).map_err(|e| e.to_string())?;
    std::fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn build_singbox_config(profile: &Value, config_path: &Path) -> Result<(), String> {
    let (raw_server_address, server_ip, outbound) = build_singbox_outbound(profile).await?;
    let singbox_cfg = profile.get("singboxConfig").cloned().unwrap_or(json!({}));

    let bypass_private_ips = profile.get("bypassPrivateIps").and_then(|v| v.as_bool())
        .or_else(|| singbox_cfg.get("bypassPrivateIps").and_then(|v| v.as_bool()))
        .unwrap_or(false);

    let bypass_iran_routes = profile.get("bypassIranRoutes").and_then(|v| v.as_bool())
        .or_else(|| singbox_cfg.get("bypassIranRoutes").and_then(|v| v.as_bool()))
        .unwrap_or(false);

    let mut custom_domains: Vec<String> = Vec::new();
    let mut custom_domain_suffixes: Vec<String> = Vec::new();
    let mut resolved_domain_ips: Vec<String> = Vec::new();

    let domains_val = profile.get("bypassDomains")
        .or_else(|| singbox_cfg.get("bypassDomains"));
    if let Some(arr) = domains_val.and_then(|v| v.as_array()) {
        for d in arr {
            if let Some(s) = d.as_str() {
                let clean = sanitize_domain(s);
                if clean.is_empty() { continue; }

                if !custom_domains.contains(&clean) {
                    custom_domains.push(clean.clone());
                }
                if !custom_domain_suffixes.contains(&clean) {
                    custom_domain_suffixes.push(clean.clone());
                }
                let dot_clean = format!(".{}", clean);
                if !custom_domain_suffixes.contains(&dot_clean) {
                    custom_domain_suffixes.push(dot_clean);
                }

                // Pre-resolve domain (and www) to IPv4 so Windows kernel & Wintun can route it directly
                let targets = [format!("{}:80", clean), format!("www.{}:80", clean)];
                for target in targets {
                    if let Ok(Ok(addrs)) = tokio::time::timeout(
                        std::time::Duration::from_millis(600),
                        tokio::net::lookup_host(&target)
                    ).await {
                        for addr in addrs {
                            if addr.is_ipv4() {
                                let cidr = format!("{}/32", addr.ip());
                                if !resolved_domain_ips.contains(&cidr) {
                                    resolved_domain_ips.push(cidr);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let mut custom_ips: Vec<String> = Vec::new();
    let ips_val = profile.get("bypassIps")
        .or_else(|| singbox_cfg.get("bypassIps"));
    if let Some(arr) = ips_val.and_then(|v| v.as_array()) {
        for ip in arr {
            if let Some(s) = ip.as_str() {
                let trimmed = s.trim();
                if !trimmed.is_empty() {
                    if trimmed.contains('/') {
                        custom_ips.push(trimmed.to_string());
                    } else {
                        custom_ips.push(format!("{}/32", trimmed));
                    }
                }
            }
        }
    }

    for ip in &resolved_domain_ips {
        if !custom_ips.contains(ip) {
            custom_ips.push(ip.clone());
        }
    }

    let mut dns_rules = vec![
        json!({
            "domain": [raw_server_address],
            "server": "direct-dns"
        })
    ];

    if !custom_domains.is_empty() {
        dns_rules.push(json!({
            "domain": custom_domains,
            "server": "direct-dns"
        }));
    }

    if !custom_domain_suffixes.is_empty() {
        dns_rules.push(json!({
            "domain_suffix": custom_domain_suffixes,
            "server": "direct-dns"
        }));
    }

    if bypass_iran_routes {
        dns_rules.push(json!({
            "domain_suffix": [".ir"],
            "server": "direct-dns"
        }));
    }

    dns_rules.push(json!({
        "query_type": ["A", "AAAA"],
        "server": "fakeip"
    }));

    let mut route_exclude_addresses: Vec<Value> = Vec::new();
    if bypass_private_ips {
        route_exclude_addresses.extend([
            json!("10.0.0.0/8"),
            json!("172.16.0.0/12"),
            json!("192.168.0.0/16"),
            json!("127.0.0.0/8"),
            json!("169.254.0.0/16"),
            json!("100.64.0.0/10"),
        ]);
    }
    for ip in &custom_ips {
        route_exclude_addresses.push(json!(ip));
    }
    if server_ip.parse::<std::net::IpAddr>().is_ok() {
        route_exclude_addresses.push(json!(format!("{}/32", server_ip)));
    }

    let mut route_rules = vec![
        json!({
            "action": "sniff",
            "sniffer": ["http", "tls", "quic"]
        }),
        json!({ "protocol": "dns", "action": "hijack-dns" }),
        json!({ "domain": [raw_server_address], "outbound": "direct" }),
        json!({ "ip_cidr": [format!("{}/32", server_ip)], "outbound": "direct" }),
    ];

    if !custom_domains.is_empty() {
        route_rules.push(json!({
            "domain": custom_domains,
            "outbound": "direct"
        }));
    }

    if !custom_domain_suffixes.is_empty() {
        route_rules.push(json!({
            "domain_suffix": custom_domain_suffixes,
            "outbound": "direct"
        }));
    }

    if !custom_ips.is_empty() {
        route_rules.push(json!({
            "ip_cidr": custom_ips,
            "outbound": "direct"
        }));
    }

    if bypass_private_ips {
        route_rules.push(json!({
            "ip_is_private": true,
            "outbound": "direct"
        }));
    }

    if bypass_iran_routes {
        route_rules.push(json!({
            "domain_suffix": [".ir"],
            "outbound": "direct"
        }));
        route_rules.push(json!({
            "ip_cidr": crate::iran_ips::IRAN_IP_CIDRS,
            "outbound": "direct"
        }));
    }

    route_rules.push(json!({ "clash_mode": "Direct", "outbound": "direct" }));
    route_rules.push(json!({ "ip_cidr": ["198.18.0.0/15"], "outbound": "proxy" }));

    // Build complete config conforming strictly to sing-box 1.12 - 1.14+ specifications
    let full_config = json!({
        "log": {
            "level": "error",
            "timestamp": true
        },
        "dns": {
            "servers": [
                {
                    "type": "fakeip",
                    "tag": "fakeip",
                    "inet4_range": "198.18.0.0/15"
                },
                {
                    "type": "tcp",
                    "tag": "proxy-dns",
                    "server": "8.8.8.8",
                    "server_port": 53,
                    "detour": "proxy"
                },
                {
                    "type": "local",
                    "tag": "direct-dns"
                }
            ],
            "rules": dns_rules,
            "final": "proxy-dns",
            "strategy": "ipv4_only"
        },
        "inbounds": [
            {
                "type": "tun",
                "tag": "tun-in",
                "interface_name": "SecureVPN-SB",
                "address": ["172.19.0.1/30"],
                "mtu": 1400,
                "auto_route": true,
                "strict_route": false,
                "stack": "system",
                "endpoint_independent_nat": true,
                "route_exclude_address": route_exclude_addresses
            },
            {
                "type": "mixed",
                "tag": "mixed-in",
                "listen": "127.0.0.1",
                "listen_port": 2080
            }
        ],
        "outbounds": [
            outbound,
            { "type": "direct", "tag": "direct" },
            { "type": "block", "tag": "block" }
        ],
        "route": {
            "auto_detect_interface": true,
            "default_domain_resolver": "direct-dns",
            "rules": route_rules,
            "final": "proxy"
        },
        "experimental": {
            "clash_api": {
                "external_controller": "127.0.0.1:9090"
            },
            "cache_file": {
                "enabled": true,
                "store_fakeip": true
            }
        }
    });

    let config_str = serde_json::to_string_pretty(&full_config).map_err(|e| e.to_string())?;
    std::fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    Ok(())
}

fn is_noisy_singbox_log(line: &str) -> bool {
    let lower = line.to_ascii_lowercase();
    lower.contains("connection:")
        || lower.contains("raw-read")
        || lower.contains("raw-write")
        || lower.contains("dial tcp")
        || lower.contains("connection download")
        || lower.contains("connection upload")
        || lower.contains("open connection to")
        || lower.contains("inbound dns packet")
        || lower.contains("dns: cached")
        || lower.contains("dns: exchange")
        || lower.contains("http2: response body closed")
        || lower.contains("context canceled")
        || lower.contains("broken pipe")
        || lower.contains("context deadline exceeded")
        || lower.contains("closed network connection")
}

pub async fn spawn_singbox(
    app: AppHandle,
    bin_path: PathBuf,
    config_path: PathBuf,
    is_running: Arc<AtomicBool>,
) -> Result<u32, String> {
    let mut child = Command::new(&bin_path)
        .arg("run")
        .arg("-c")
        .arg(&config_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(0x08000000) // CREATE_NO_WINDOW on Windows
        .spawn()
        .map_err(|e| format!("Failed to spawn sing-box: {}", e))?;

    let pid = child.id().ok_or_else(|| "Failed to get sing-box PID".to_string())?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let app_clone = app.clone();
    tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let clean = strip_ansi_codes(&line);
                if is_noisy_singbox_log(&clean) {
                    continue;
                }
                let _ = app_clone.emit("vpn:log", VpnLog {
                    level: "info".into(),
                    message: clean,
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                });
            }
        }
    });

    let app_clone2 = app.clone();
    tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let clean = strip_ansi_codes(&line);
                if is_noisy_singbox_log(&clean) {
                    continue;
                }
                let _ = app_clone2.emit("vpn:log", VpnLog {
                    level: "warning".into(),
                    message: clean,
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                });
            }
        }
    });

    // Check if sing-box died immediately on startup (e.g. invalid config or port collision)
    tokio::time::sleep(Duration::from_millis(300)).await;
    if let Ok(Some(status)) = child.try_wait() {
        is_running.store(false, Ordering::SeqCst);
        return Err(format!("sing-box terminated immediately (exit code: {})", status));
    }

    // Background monitor task
    let is_running_clone = is_running.clone();
    let app_clone3 = app.clone();
    tokio::spawn(async move {
        let status = child.wait().await;
        is_running_clone.store(false, Ordering::SeqCst);
        crate::commands::set_system_proxy(false, None);
        let _ = app_clone3.emit("vpn:stateChanged", VpnState {
            status: "disconnected".into(),
            profile: None,
            stats: VpnStats::default(),
        });
        println!("sing-box process exited: {:?}", status);
    });

    Ok(pid)
}

pub async fn run_tcp_ping(host: String, port: u16) -> Result<i64, String> {
    let addr = format!("{}:{}", host, port);
    let start = Instant::now();
    match tokio::time::timeout(Duration::from_millis(3000), tokio::net::TcpStream::connect(&addr)).await {
        Ok(Ok(_)) => Ok(start.elapsed().as_millis() as i64),
        Ok(Err(e)) => Err(e.to_string()),
        Err(_) => Err("Timeout".into()),
    }
}
