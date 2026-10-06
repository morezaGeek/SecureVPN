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
    if let Ok(Ok(addrs)) = tokio::time::timeout(Duration::from_secs(4), tokio::net::lookup_host(&addr_str)).await {
        for addr in addrs {
            if addr.is_ipv4() {
                return addr.ip().to_string();
            }
        }
    }

    host.to_string()
}

fn server_cidr(address: &str) -> Option<String> {
    address.parse::<std::net::IpAddr>().ok().map(|ip| {
        format!("{}/{}", ip, if ip.is_ipv4() { 32 } else { 128 })
    })
}

fn server_direct_rules(host: &str, address: &str) -> Vec<Value> {
    let mut rules = vec![json!({ "domain": [host], "outbound": "direct" })];
    if let Some(cidr) = server_cidr(address) {
        rules.push(json!({ "ip_cidr": [cidr], "outbound": "direct" }));
    }
    rules
}

fn unescape_percent_encoding(s: &str) -> String {
    let mut res = String::with_capacity(s.len());
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(hex) = std::str::from_utf8(&bytes[i + 1..i + 3]) {
                if let Ok(val) = u8::from_str_radix(hex, 16) {
                    res.push(val as char);
                    i += 3;
                    continue;
                }
            }
        }
        res.push(bytes[i] as char);
        i += 1;
    }
    res
}

pub async fn build_singbox_outbound(profile: &Value) -> Result<(String, String, Value), String> {
    build_singbox_outbound_with_tag(profile, "proxy").await
}

pub async fn build_singbox_outbound_with_tag(profile: &Value, tag: &str) -> Result<(String, String, Value), String> {
    let protocol = profile.get("protocol").and_then(|v| v.as_str()).unwrap_or("vless");
    let raw_server_address = profile.get("serverAddress")
        .and_then(|v| v.as_str())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .unwrap_or("127.0.0.1");
    let port = profile.get("port").and_then(|v| v.as_u64()).unwrap_or(443);
    let singbox_cfg = profile.get("singboxConfig").cloned().unwrap_or(json!({}));

    // Pre-resolve hostname to IPv4 to prevent sing-box circular DNS query loopback
    let server_ip = resolve_hostname_to_ip(raw_server_address).await;

    let uuid = singbox_cfg.get("uuid").and_then(|v| v.as_str()).unwrap_or("");
    let transport = singbox_cfg.get("transport").and_then(|v| v.as_str()).unwrap_or("tcp");
    let security = singbox_cfg.get("security").and_then(|v| v.as_str()).unwrap_or("none");
    let configured_sni = singbox_cfg.get("sni")
        .and_then(|v| v.as_str())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let configured_host = singbox_cfg.get("host")
        .and_then(|v| v.as_str())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let default_domain = configured_sni
        .or(configured_host)
        .unwrap_or(raw_server_address);
    let sni = configured_sni.unwrap_or(default_domain);
    let host = configured_host.unwrap_or(default_domain);
    let fingerprint = singbox_cfg.get("fingerprint").and_then(|v| v.as_str()).unwrap_or("chrome");

    // Build outbound based on protocol
    let mut outbound = match protocol {
        "hysteria2" => {
            let mut o = json!({
                "type": "hysteria2",
                "tag": tag,
                "server": server_ip,
                "server_port": port,
                "password": uuid
            });
            if let Some(obfs) = singbox_cfg.get("hysteriaObfs").and_then(|v| v.as_str()) {
                if obfs == "salamander" {
                    let obfs_pw = singbox_cfg.get("hysteriaObfsPassword").and_then(|v| v.as_str()).unwrap_or("");
                    o["obfs"] = json!({
                        "type": "salamander",
                        "password": obfs_pw
                    });
                }
            }
            o
        }
        "vless" => {
            let mut o = json!({
                "type": "vless",
                "tag": tag,
                "server": server_ip,
                "server_port": port,
                "uuid": uuid
            });
            if let Some(encryption) = singbox_cfg.get("encryption").and_then(Value::as_str)
                .map(str::trim).filter(|value| !value.is_empty() && *value != "none") {
                o["encryption"] = json!(encryption);
            }
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
        });

        // Hysteria2 is QUIC-based and does not support uTLS
        if protocol != "hysteria2" {
            tls_obj["utls"] = json!({
                "enabled": true,
                "fingerprint": fingerprint
            });
        }

        if security == "tls" {
            let custom_alpn: Option<Vec<String>> = singbox_cfg.get("alpn")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|x| {
                    let s = x.as_str().map(|s| s.trim()).unwrap_or("");
                    if !s.is_empty() { Some(s.to_string()) } else { None }
                }).collect())
                .filter(|v: &Vec<String>| !v.is_empty());

            let alpn = if transport == "ws" || transport == "httpupgrade" {
                // WebSocket and HttpUpgrade MUST negotiate HTTP/1.1!
                // Reverse proxies / CDNs (especially Cloudflare) reject or reset WebSocket if HTTP/2 is negotiated.
                vec!["http/1.1".to_string()]
            } else if transport == "xhttp" || transport == "grpc" {
                custom_alpn.unwrap_or_else(|| vec!["h2".to_string()])
            } else if let Some(custom) = custom_alpn {
                custom
            } else {
                vec!["h2".to_string(), "http/1.1".to_string()]
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

        if singbox_cfg.get("insecure").and_then(|v| v.as_bool()).unwrap_or(false)
            || singbox_cfg.get("allowInsecure").and_then(|v| v.as_bool()).unwrap_or(false) {
            tls_obj["insecure"] = json!(true);
        }

        outbound["tls"] = tls_obj;
    }

    // Transport config
    if transport == "ws" {
        let raw_path = singbox_cfg.get("path")
            .and_then(|v| v.as_str())
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .unwrap_or("/");

        let unescaped = unescape_percent_encoding(raw_path);
        let mut final_path = if unescaped.starts_with('/') { unescaped } else { format!("/{}", unescaped) };

        let mut max_early_data: Option<u32> = None;
        let mut early_data_header_name: Option<String> = None;

        // Parse ed=(\d+)
        if let Ok(re_ed) = regex::Regex::new(r"[?&]ed=(\d+)") {
            if let Some(caps) = re_ed.captures(&final_path) {
                if let Some(m) = caps.get(1) {
                    if let Ok(val) = m.as_str().parse::<u32>() {
                        if val > 0 {
                            max_early_data = Some(val);
                            early_data_header_name = Some("Sec-WebSocket-Protocol".to_string());
                        }
                    }
                }
                let cleaned = re_ed.replace_all(&final_path, "").to_string();
                final_path = cleaned.replace("?&", "?");
                if final_path.ends_with('?') {
                    final_path.pop();
                }
            }
        }

        // Parse eh=([^&]+)
        if let Ok(re_eh) = regex::Regex::new(r"[?&]eh=([^&]+)") {
            if let Some(caps) = re_eh.captures(&final_path) {
                if let Some(m) = caps.get(1) {
                    early_data_header_name = Some(unescape_percent_encoding(m.as_str()));
                }
                let cleaned = re_eh.replace_all(&final_path, "").to_string();
                final_path = cleaned.replace("?&", "?");
                if final_path.ends_with('?') {
                    final_path.pop();
                }
            }
        }

        if final_path.is_empty() {
            final_path = "/".to_string();
        }

        let mut ws_obj = json!({
            "type": "ws",
            "path": final_path,
            "headers": {
                "Host": host
            }
        });

        if let Some(ed) = max_early_data {
            ws_obj["max_early_data"] = json!(ed);
            ws_obj["early_data_header_name"] = json!(early_data_header_name.unwrap_or_else(|| "Sec-WebSocket-Protocol".to_string()));
        }

        outbound["transport"] = ws_obj;
    } else if transport == "httpupgrade" {
        let path = singbox_cfg.get("path")
            .and_then(|v| v.as_str())
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .unwrap_or("/");

        outbound["transport"] = json!({
            "type": "httpupgrade",
            "path": path,
            "host": host
        });
    } else if transport == "xhttp" {
        let extra = singbox_cfg.get("extra").cloned().unwrap_or(json!({}));
        let path = singbox_cfg.get("path")
            .and_then(|v| v.as_str())
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .unwrap_or("/");
        let mode = singbox_cfg.get("mode")
            .and_then(|v| v.as_str())
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .or_else(|| extra.get("mode").and_then(Value::as_str).filter(|s| !s.is_empty()))
            .unwrap_or("auto");

        outbound["transport"] = json!({
            "type": "xhttp",
            "mode": mode,
            "path": path,
            "host": host
        });
        if let Some(padding) = extra.get("xPaddingBytes").or_else(|| extra.get("x_padding_bytes")) {
            let range = padding.as_str().map(str::to_string).unwrap_or_else(|| padding.to_string());
            if !regex::Regex::new(r"^\d+(?:-\d+)?$").unwrap().is_match(&range) {
                return Err("Invalid XHTTP xPaddingBytes range".into());
            }
            outbound["transport"]["x_padding_bytes"] = json!(range);
        }
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
    base_port: u16,
) -> Result<Vec<(String, u16)>, String> {
    let mut outbounds = Vec::new();
    let mut inbounds = Vec::new();
    let mut route_rules = Vec::new();
    let mut port_map = Vec::new();

    for (i, p) in profiles.iter().enumerate() {
        let protocol = p.get("protocol").and_then(|v| v.as_str()).unwrap_or("");
        if !["vless", "vmess", "trojan", "shadowsocks", "hysteria2"].contains(&protocol) {
            continue;
        }

        let id = p.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let tag = format!("proxy-{}", i);
        let in_tag = format!("in-{}", i);
        let port = base_port + port_map.len() as u16;

        match build_singbox_outbound_with_tag(p, &tag).await {
            Ok((_raw_addr, _server_ip, outbound)) => {
                inbounds.push(json!({
                    "type": "mixed",
                    "tag": in_tag,
                    "listen": "127.0.0.1",
                    "listen_port": port
                }));

                route_rules.push(json!({
                    "inbound": [in_tag],
                    "outbound": tag
                }));

                outbounds.push(outbound);
                port_map.push((id, port));
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
        "inbounds": inbounds,
        "outbounds": outbounds,
        "route": {
            "default_domain_resolver": "direct-dns",
            "rules": route_rules,
            "final": "direct"
        }
    });

    let config_str = serde_json::to_string_pretty(&full_config).map_err(|e| e.to_string())?;
    std::fs::write(config_path, config_str).map_err(|e| e.to_string())?;
    Ok(port_map)
}

#[allow(dead_code)]
pub async fn build_singbox_test_config(profile: &Value, config_path: &Path) -> Result<(), String> {
    let (raw_server_address, server_ip, outbound) = build_singbox_outbound(profile).await?;

    let rules = server_direct_rules(&raw_server_address, &server_ip);
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
            "rules": rules,
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
    if let Some(cidr) = server_cidr(&server_ip) {
        route_exclude_addresses.push(json!(cidr));
    }

    let mut route_rules = vec![
        json!({
            "action": "sniff",
            "sniffer": ["http", "tls", "quic"]
        }),
        json!({ "protocol": "dns", "action": "hijack-dns" }),
    ];
    route_rules.extend(server_direct_rules(&raw_server_address, &server_ip));

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
    if lower.contains("fatal") { return false; }
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
    let check = Command::new(&bin_path)
        .args(["check", "-c"]).arg(&config_path)
        .creation_flags(0x08000000)
        .output().await.map_err(|e| format!("Cannot validate sing-box configuration: {}", e))?;
    if !check.status.success() {
        let error = strip_ansi_codes(&String::from_utf8_lossy(&check.stderr));
        return Err(format!("Invalid VPN configuration: {}", error.trim()));
    }
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
        crate::commands::clear_app_system_proxy();
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dns_failure_never_creates_hostname_cidr_and_ipv6_uses_host_prefix() {
        assert_eq!(server_cidr("s1.rahanetmci.com"), None);
        assert_eq!(server_cidr("91.107.158.74"), Some("91.107.158.74/32".into()));
        assert_eq!(server_cidr("2001:db8::1"), Some("2001:db8::1/128".into()));
        assert_eq!(server_direct_rules("s1.rahanetmci.com", "s1.rahanetmci.com"),
            vec![json!({ "domain": ["s1.rahanetmci.com"], "outbound": "direct" })]);
        assert_eq!(server_direct_rules("example.com", "2001:db8::1")[1]["ip_cidr"], json!(["2001:db8::1/128"]));
    }

    #[test]
    fn fatal_connection_errors_are_not_hidden_by_noise_filter() {
        assert!(!is_noisy_singbox_log("FATAL initialize router: context deadline exceeded"));
        assert!(is_noisy_singbox_log("connection download: context canceled"));
    }

    #[tokio::test]
    async fn encrypted_vless_keeps_key_and_ws_only_negotiates_http11() {
        let mut profile = json!({"protocol":"vless","serverAddress":"192.0.2.1","port":2053,
            "singboxConfig":{"uuid":"00000000-0000-4000-8000-000000000001","transport":"ws",
                "security":"tls","sni":"example.com","alpn":["h2","http/1.1","h3"],
                "encryption":"mlkem768x25519plus.native.0rtt.test-key"}});
        let (_, _, outbound) = build_singbox_outbound(&profile).await.unwrap();
        assert_eq!(outbound["encryption"], profile["singboxConfig"]["encryption"]);
        assert_eq!(outbound["tls"]["alpn"], json!(["http/1.1"]));
        for transport in ["httpupgrade", "tcp", "xhttp"] {
            profile["singboxConfig"]["transport"] = json!(transport);
            let (_, _, outbound) = build_singbox_outbound(&profile).await.unwrap();
            assert_eq!(outbound["encryption"], profile["singboxConfig"]["encryption"]);
            if transport == "httpupgrade" { assert_eq!(outbound["tls"]["alpn"], json!(["http/1.1"])); }
            else { assert_eq!(outbound["tls"]["alpn"], profile["singboxConfig"]["alpn"]); }
        }
        profile["singboxConfig"]["encryption"] = json!("none");
        let (_, _, outbound) = build_singbox_outbound(&profile).await.unwrap();
        assert!(outbound.get("encryption").is_none());
        profile["protocol"] = json!("vmess");
        profile["singboxConfig"]["encryption"] = json!("auto");
        let (_, _, outbound) = build_singbox_outbound(&profile).await.unwrap();
        assert_eq!(outbound["security"], "auto");
        assert!(outbound.get("encryption").is_none());
    }

    #[tokio::test]
    async fn xhttp_keeps_subscription_padding_and_explicit_mode_wins() {
        let mut profile = json!({"protocol":"vless","serverAddress":"192.0.2.1","port":443,
            "singboxConfig":{"uuid":"test-user","transport":"xhttp","security":"tls",
                "mode":"packet-up","extra":{"mode":"auto","xPaddingBytes":"100-1000"}}});
        let (_, _, outbound) = build_singbox_outbound(&profile).await.unwrap();
        assert_eq!(outbound["transport"]["mode"], "packet-up");
        assert_eq!(outbound["transport"]["x_padding_bytes"], "100-1000");
        profile["singboxConfig"]["extra"]["xPaddingBytes"] = json!("invalid");
        assert!(build_singbox_outbound(&profile).await.is_err());
    }

    #[tokio::test]
    #[ignore = "Local private fixture export; does not start a VPN or change system proxy"]
    async fn diagnostics_export_profiles() {
        let fixture = std::env::var("SECUREVPN_DIAGNOSTICS_FIXTURE").expect("fixture path");
        let directory = PathBuf::from(std::env::var("SECUREVPN_DIAGNOSTICS_OUTPUT").expect("output directory"));
        let profiles: Vec<Value> = serde_json::from_str(&std::fs::read_to_string(fixture).unwrap()).unwrap();
        std::fs::create_dir_all(&directory).unwrap();
        for (index, profile) in profiles.iter().enumerate() {
            assert_ne!(profile["name"], "Direct-To-Server", "Excluded by user");
            build_singbox_config(profile, &directory.join(format!("full-{}.private.json", index))).await.unwrap();
        }
        let map = build_singbox_batch_test_config(&profiles, &directory.join("batch.private.json"), 23100).await.unwrap();
        std::fs::write(directory.join("port-map.private.json"), serde_json::to_string(&map).unwrap()).unwrap();
        println!("Exported {} full configurations and {} isolated proxy routes", profiles.len(), map.len());
    }

    #[test]
    fn test_unescape_percent_encoding() {
        assert_eq!(unescape_percent_encoding("%2F%3Fed%3D2048"), "/?ed=2048");
        assert_eq!(unescape_percent_encoding("/mypath"), "/mypath");
        assert_eq!(unescape_percent_encoding("/"), "/");
    }

    #[tokio::test]
    async fn test_germany_vless_ws_alpn_and_host() {
        let profile = json!({
            "id": "de-1",
            "protocol": "vless",
            "serverAddress": "104.21.58.52",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "ws",
                "security": "tls",
                "sni": "ovh.rahanetmci.com",
                "host": "", // host is empty in subscription link
                "alpn": ["h2"], // link erroneously specifies h2
                "path": "/?ed=2048"
            }
        });

        let (_, _, outbound) = build_singbox_outbound_with_tag(&profile, "proxy-de").await.unwrap();

        // ALPN must be http/1.1 for WebSocket, never pure h2
        let alpn = outbound["tls"]["alpn"].as_array().unwrap();
        assert_eq!(alpn, &vec![json!("http/1.1")]);

        // Host header must NOT be empty string; it must fall back to sni
        let host = outbound["transport"]["headers"]["Host"].as_str().unwrap();
        assert_eq!(host, "ovh.rahanetmci.com");

        // Path must have ed stripped, and max_early_data set
        let path = outbound["transport"]["path"].as_str().unwrap();
        assert_eq!(path, "/");
        assert_eq!(outbound["transport"]["max_early_data"], json!(2048));
        assert_eq!(outbound["transport"]["early_data_header_name"], json!("Sec-WebSocket-Protocol"));
    }

    #[tokio::test]
    async fn test_georgia_vless_xhttp_alpn_and_host() {
        let profile = json!({
            "id": "georgia-1",
            "protocol": "vless",
            "serverAddress": "tr4.rahanetmci.com",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "xhttp",
                "security": "tls",
                "sni": "tr4.rahanetmci.com",
                "host": "",
                "path": "/",
                "mode": "auto"
            }
        });

        let (_, _, outbound) = build_singbox_outbound_with_tag(&profile, "proxy-georgia").await.unwrap();

        // XHTTP uses h2 ALPN
        let alpn = outbound["tls"]["alpn"].as_array().unwrap();
        assert_eq!(alpn, &vec![json!("h2")]);

        // Host must fall back to sni
        let host = outbound["transport"]["host"].as_str().unwrap();
        assert_eq!(host, "tr4.rahanetmci.com");
        assert_eq!(outbound["transport"]["mode"], "auto");
    }

    #[tokio::test]
    async fn test_ws_without_early_data() {
        let profile = json!({
            "id": "ws-plain",
            "protocol": "vless",
            "serverAddress": "1.2.3.4",
            "port": 443,
            "singboxConfig": {
                "uuid": "uuid",
                "transport": "ws",
                "security": "tls",
                "sni": "example.com",
                "path": "/ws-path"
            }
        });

        let (_, _, outbound) = build_singbox_outbound_with_tag(&profile, "proxy-plain").await.unwrap();

        assert_eq!(outbound["transport"]["path"], "/ws-path");
        assert!(outbound["transport"].get("max_early_data").is_none());
        assert!(outbound["transport"].get("early_data_header_name").is_none());
    }

    #[tokio::test]
    #[ignore]
    async fn test_live_real_delay_germany_and_georgia() {
        let de_profile = json!({
            "id": "live-de",
            "protocol": "vless",
            "serverAddress": "104.21.58.52",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "ws",
                "security": "tls",
                "sni": "ovh.rahanetmci.com",
                "host": "",
                "alpn": ["h2"],
                "path": "/"
            }
        });

        let geo_profile = json!({
            "id": "live-geo",
            "protocol": "vless",
            "serverAddress": "tr4.rahanetmci.com",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "xhttp",
                "security": "tls",
                "sni": "tr4.rahanetmci.com",
                "host": "",
                "path": "/",
                "mode": "auto"
            }
        });

        let az_profile = json!({
            "id": "live-az",
            "protocol": "vless",
            "serverAddress": "tr5.rahanetmci.com",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "xhttp",
                "security": "tls",
                "sni": "tr5.rahanetmci.com",
                "host": "",
                "path": "/",
                "mode": "auto"
            }
        });

        let us_profile = json!({
            "id": "live-us",
            "protocol": "vless",
            "serverAddress": "us4.rahanetmci.com",
            "port": 443,
            "singboxConfig": {
                "uuid": "cced80e7-6419-494c-9032-940e9e372663",
                "transport": "xhttp",
                "security": "tls",
                "sni": "us4.rahanetmci.com",
                "host": "",
                "path": "/",
                "mode": "auto"
            }
        });

        let temp_dir = std::env::temp_dir();
        let cfg_path = temp_dir.join("sb-live-test.json");
        let port_map = build_singbox_batch_test_config(&[de_profile, geo_profile, az_profile, us_profile], &cfg_path, 19888).await.unwrap();
        assert_eq!(port_map.len(), 4);

        let bin_path = std::path::PathBuf::from(r"..\resources\singbox\sing-box.exe");
        if !bin_path.exists() {
            println!("sing-box binary not found at {:?}, skipping live test", bin_path);
            let _ = std::fs::remove_file(&cfg_path);
            return;
        }

        let mut cmd = tokio::process::Command::new(&bin_path);
        cmd.args(["run", "-c", cfg_path.to_str().unwrap()]);
        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                println!("Cannot spawn sing-box: {}, skipping live test", e);
                let _ = std::fs::remove_file(&cfg_path);
                return;
            }
        };

        // Wait for port 19888 to be ready
        let mut ready = false;
        for _ in 0..40 {
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
            if std::net::TcpStream::connect(("127.0.0.1", 19888)).is_ok() {
                ready = true;
                break;
            }
        }
        assert!(ready, "sing-box failed to start test listeners");

        let test_url = "https://www.google.com/generate_204";

        for (id, port) in port_map {
            let proxy_url = format!("http://127.0.0.1:{}", port);
            let proxy = reqwest::Proxy::all(&proxy_url).unwrap();
            let client = reqwest::Client::builder()
                .proxy(proxy)
                .timeout(std::time::Duration::from_millis(4000))
                .connect_timeout(std::time::Duration::from_millis(3500))
                .build()
                .unwrap();

            let mut latencies = Vec::new();
            for i in 0..2 {
                let start = std::time::Instant::now();
                match client.get(test_url).send().await {
                    Ok(resp) => {
                        let s = resp.status();
                        let _ = resp.text().await;
                        let elapsed = start.elapsed().as_millis() as i64;
                        println!("Reqwest {} attempt {}: status {}, elapsed {} ms", id, i, s, elapsed);
                        if s.as_u16() == 204 || s.is_success() {
                            latencies.push(elapsed);
                        }
                    }
                    Err(e) => {
                        println!("Reqwest {} attempt {} err: {}", id, i, e);
                        break;
                    }
                }
                tokio::time::sleep(std::time::Duration::from_millis(50)).await;
            }

            let min_ms = latencies.iter().copied().min().unwrap_or(-1);
            println!("Profile {} reqwest min latency: {} ms", id, min_ms);
            assert!(min_ms > 0, "Profile {} failed real delay test", id);
        }

        let _ = child.kill().await;
        let _ = std::fs::remove_file(&cfg_path);
    }
}
