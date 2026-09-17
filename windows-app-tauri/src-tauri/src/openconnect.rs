use std::ffi::OsString;
use std::net::ToSocketAddrs;
use std::os::windows::ffi::{OsStrExt, OsStringExt};
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use regex::Regex;
use serde_json::Value;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

use crate::state::{VpnLog, VpnState, VpnStats};

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(windows)]
fn get_short_path(path: &Path) -> PathBuf {
    let wide: Vec<u16> = path.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    let mut buffer: Vec<u16> = vec![0; 1024];

    extern "system" {
        fn GetShortPathNameW(
            lpszLongPath: *const u16,
            lpszShortPath: *mut u16,
            cchBuffer: u32,
        ) -> u32;
    }

    unsafe {
        let len = GetShortPathNameW(wide.as_ptr(), buffer.as_mut_ptr(), buffer.len() as u32);
        if len > 0 && (len as usize) < buffer.len() {
            let os_str = OsString::from_wide(&buffer[..len as usize]);
            return PathBuf::from(os_str);
        }
    }
    path.to_path_buf()
}

#[cfg(not(windows))]
fn get_short_path(path: &Path) -> PathBuf {
    path.to_path_buf()
}

pub fn resolve_host_to_ip(host: &str) -> Option<String> {
    if host.split('.').count() == 4 && host.chars().all(|c| c.is_ascii_digit() || c == '.') {
        return Some(host.to_string());
    }
    let target = format!("{}:443", host);
    if let Ok(mut addrs) = target.to_socket_addrs() {
        if let Some(addr) = addrs.next() {
            return Some(addr.ip().to_string());
        }
    }
    None
}

pub fn get_default_gateway_and_if() -> (String, u32) {
    #[cfg(windows)]
    {
        // 1. Try netsh route list (fast and accurate)
        if let Ok(output) = std::process::Command::new("netsh")
            .args(["interface", "ipv4", "show", "route"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.contains("0.0.0.0/0") {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 6 {
                        let gw = parts[parts.len() - 1];
                        let if_str = parts[parts.len() - 2];
                        if gw.split('.').count() == 4 {
                            let if_idx = if_str.parse::<u32>().unwrap_or(0);
                            return (gw.to_string(), if_idx);
                        }
                    }
                }
            }
        }

        // 2. Fallback to route print 0.0.0.0
        if let Ok(output2) = std::process::Command::new("route")
            .args(["print", "0.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let text2 = String::from_utf8_lossy(&output2.stdout);
            for line in text2.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 5 && parts[0] == "0.0.0.0" && parts[1] == "0.0.0.0" {
                    let gw = parts[2];
                    if gw != "0.0.0.0" && gw.split('.').count() == 4 {
                        return (gw.to_string(), 0);
                    }
                }
            }
        }
    }
    ("".to_string(), 0)
}

pub fn find_interface_index_by_name(name: &str) -> Option<u32> {
    #[cfg(windows)]
    {
        if let Ok(output) = std::process::Command::new("netsh")
            .args(["interface", "ipv4", "show", "interfaces"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.to_lowercase().contains(&name.to_lowercase()) {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if !parts.is_empty() {
                        if let Ok(idx) = parts[0].parse::<u32>() {
                            return Some(idx);
                        }
                    }
                }
            }
        }
    }
    None
}

pub fn cleanup_openconnect_routes(server_ip: Option<&str>, if_name: Option<&str>) {
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("route")
            .args(["delete", "0.0.0.0", "mask", "128.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        let _ = std::process::Command::new("route")
            .args(["delete", "128.0.0.0", "mask", "128.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        if let Some(ip) = server_ip {
            if !ip.is_empty() {
                let _ = std::process::Command::new("route")
                    .args(["delete", ip])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            }
        }

        let name = if_name.unwrap_or("SecureVPN");
        let _ = std::process::Command::new("netsh")
            .args(["interface", "ipv4", "set", "address", &format!("name=\"{}\"", name), "dhcp"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        let _ = std::process::Command::new("netsh")
            .args(["interface", "ipv4", "set", "dnsservers", &format!("name=\"{}\"", name), "dhcp"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
    }
}

pub fn apply_openconnect_routing(
    server_ip: &str,
    orig_gw: &str,
    orig_if_idx: u32,
    vpn_if_idx: u32,
    vpn_if_name: &str,
    vpn_ip: &str,
    vpn_mask: &str,
    vpn_dns: &str,
    vpn_mtu: Option<u32>,
    profile: &Value,
    app: &AppHandle,
) {
    #[cfg(windows)]
    {
        let log_msg = |msg: &str| {
            println!("[OpenConnect Routing] {}", msg);
            let _ = app.emit("vpn:log", VpnLog {
                level: "info".into(),
                message: format!("[Routing] {}", msg),
                timestamp: chrono::Utc::now().timestamp_millis() as u64,
            });
        };

        log_msg(&format!(
            "Configuring tunnel routing: VPN IP={}, IF index={}, Gateway={}",
            vpn_ip, vpn_if_idx, orig_gw
        ));

        // 1. Host route for VPN server IP through physical gateway (prevents connection loop)
        if !server_ip.is_empty() && !orig_gw.is_empty() {
            let mut cmd = std::process::Command::new("route");
            cmd.args(["add", server_ip, "mask", "255.255.255.255", orig_gw]);
            if orig_if_idx > 0 {
                cmd.args(["IF", &orig_if_idx.to_string()]);
            }
            cmd.args(["metric", "1"]).creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.output();
            log_msg(&format!("VPN server exclusion route added for {}", server_ip));
        }

        // 2. Set static IP and netmask on Wintun adapter
        let target_adapter = if vpn_if_idx > 0 {
            vpn_if_idx.to_string()
        } else {
            vpn_if_name.to_string()
        };

        let _ = std::process::Command::new("netsh")
            .args([
                "interface", "ipv4", "set", "address",
                &format!("name=\"{}\"", target_adapter),
                "static", vpn_ip, vpn_mask, "store=active"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        // 3. Set MTU if detected
        if let Some(mtu_val) = vpn_mtu {
            let _ = std::process::Command::new("netsh")
                .args([
                    "interface", "ipv4", "set", "subinterface",
                    &format!("\"{}\"", target_adapter),
                    &format!("mtu={}", mtu_val), "store=active"
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
        }

        // 4. Set DNS on the adapter
        let primary_dns = if !vpn_dns.is_empty() { vpn_dns } else { "8.8.8.8" };
        let _ = std::process::Command::new("netsh")
            .args([
                "interface", "ipv4", "set", "dnsservers",
                &format!("name=\"{}\"", target_adapter),
                "static", primary_dns, "primary", "validate=no"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        let _ = std::process::Command::new("netsh")
            .args([
                "interface", "ipv4", "add", "dnsservers",
                &format!("name=\"{}\"", target_adapter),
                "1.1.1.1", "index=2", "validate=no"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let _ = std::process::Command::new("ipconfig")
            .arg("/flushdns")
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        // 5. Default tunnel routes (0.0.0.0/1 and 128.0.0.0/1 via on-link 0.0.0.0)
        let _ = std::process::Command::new("route")
            .args(["delete", "0.0.0.0", "mask", "128.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        let _ = std::process::Command::new("route")
            .args(["delete", "128.0.0.0", "mask", "128.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let r1 = std::process::Command::new("route")
            .args([
                "add", "0.0.0.0", "mask", "128.0.0.0", "0.0.0.0",
                "IF", &vpn_if_idx.to_string(), "metric", "500"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = r1 {
            if !out.status.success() {
                let _ = std::process::Command::new("netsh")
                    .args([
                        "interface", "ipv4", "add", "route", "0.0.0.0/1",
                        &format!("interface=\"{}\"", vpn_if_idx),
                        "nexthop=0.0.0.0", "metric=500", "store=active"
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            }
        }

        let r2 = std::process::Command::new("route")
            .args([
                "add", "128.0.0.0", "mask", "128.0.0.0", "0.0.0.0",
                "IF", &vpn_if_idx.to_string(), "metric", "500"
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        if let Ok(out) = r2 {
            if !out.status.success() {
                let _ = std::process::Command::new("netsh")
                    .args([
                        "interface", "ipv4", "add", "route", "128.0.0.0/1",
                        &format!("interface=\"{}\"", vpn_if_idx),
                        "nexthop=0.0.0.0", "metric=500", "store=active"
                    ])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            }
        }

        log_msg("Default routes (0.0.0.0/1 & 128.0.0.0/1) added successfully to VPN interface.");

        // 6. Private IP bypass if enabled
        let bypass_private = profile.get("bypassPrivateIps").and_then(|v| v.as_bool()).unwrap_or(true);
        if bypass_private && !orig_gw.is_empty() {
            let privates = [
                ("10.0.0.0", "255.0.0.0"),
                ("172.16.0.0", "255.240.0.0"),
                ("192.168.0.0", "255.255.0.0"),
                ("127.0.0.0", "255.0.0.0"),
                ("169.254.0.0", "255.255.0.0"),
                ("100.64.0.0", "255.192.0.0"),
            ];
            for (net, mask) in privates {
                let _ = std::process::Command::new("route")
                    .args(["add", net, "mask", mask, orig_gw, "metric", "1"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            }
            log_msg("Private IP bypass routes added.");
        }

        // 7. Custom bypass domains
        if let Some(domains) = profile.get("bypassDomains").and_then(|v| v.as_array()) {
            for d in domains {
                if let Some(dom_str) = d.as_str() {
                    let clean = dom_str.trim().trim_start_matches('.');
                    if let Some(ip) = resolve_host_to_ip(clean) {
                        let _ = std::process::Command::new("route")
                            .args(["add", &ip, "mask", "255.255.255.255", orig_gw, "metric", "1"])
                            .creation_flags(CREATE_NO_WINDOW)
                            .output();
                    }
                }
            }
        }
    }
}

pub async fn spawn_openconnect(
    app: AppHandle,
    bin_path: PathBuf,
    profile: Value,
    cached_fingerprint: Option<String>,
    is_running: Arc<AtomicBool>,
    vpn_state_arc: Arc<Mutex<VpnState>>,
) -> Result<u32, String> {
    let server_address = profile.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("");
    let port = profile.get("port").and_then(|v| v.as_u64()).unwrap_or(443);
    let username = profile.get("username").and_then(|v| v.as_str()).unwrap_or("");
    let password = profile.get("password").and_then(|v| v.as_str()).unwrap_or("");
    let skip_cert = profile.get("skipCertificateVerification").and_then(|v| v.as_bool()).unwrap_or(false);
    let disable_dtls = profile.get("disableDtls").and_then(|v| v.as_bool()).unwrap_or(false);
    let mtu = profile.get("mtu").and_then(|v| v.as_u64()).unwrap_or(1200);

    // 1. Terminate any previous openconnect process & wait for Wintun handle release
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", "openconnect.exe"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    // 2. Discover original physical gateway and physical interface index
    let (orig_gw, orig_if_idx) = get_default_gateway_and_if();
    let server_ip_resolved = resolve_host_to_ip(server_address).unwrap_or_else(|| server_address.to_string());

    // 3. Create dummy vpnc script in TEMP with guaranteed NO SPACES via 8.3 short path
    let temp_script = std::env::temp_dir().join("vpnc-dummy.js");
    let _ = std::fs::write(&temp_script, "WScript.Quit(0);\r\n");
    let short_script_path = get_short_path(&temp_script);

    let mut cmd = Command::new(&bin_path);
    cmd.arg("--protocol=anyconnect")
       .arg(format!("--server={}:{}", server_address, port))
       .arg("--interface=SecureVPN")
       .arg("--script").arg(&short_script_path)
       .arg("--passwd-on-stdin")
       .arg("-v");

    if !username.is_empty() {
        cmd.arg(format!("--user={}", username));
    }

    if disable_dtls {
        cmd.arg("--no-dtls");
    } else {
        cmd.arg(format!("--base-mtu={}", mtu));
    }

    if skip_cert {
        if let Some(ref fp) = cached_fingerprint {
            cmd.arg(format!("--servercert={}", fp));
        }
    }

    cmd.stdin(Stdio::piped())
       .stdout(Stdio::piped())
       .stderr(Stdio::piped())
       .creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn openconnect: {}", e))?;

    // Pipe password
    if let Some(mut stdin) = child.stdin.take() {
        let pwd = format!("{}\n", password);
        tokio::spawn(async move {
            let _ = stdin.write_all(pwd.as_bytes()).await;
            let _ = stdin.flush().await;
        });
    }

    let pid = child.id().ok_or_else(|| "Failed to get openconnect PID".to_string())?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    // Tracking state for network configuration
    let detected_wintun_idx: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));
    let detected_wintun_name: Arc<Mutex<String>> = Arc::new(Mutex::new("SecureVPN".into()));
    let detected_vpn_ip: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    let detected_vpn_mask: Arc<Mutex<String>> = Arc::new(Mutex::new("255.255.255.0".into()));
    let detected_vpn_dns: Arc<Mutex<String>> = Arc::new(Mutex::new("8.8.8.8".into()));
    let detected_server_ip: Arc<Mutex<String>> = Arc::new(Mutex::new(server_ip_resolved.clone()));
    let detected_mtu: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(Some(mtu as u32)));
    let routing_applied = Arc::new(AtomicBool::new(false));

    // Regex matchers
    let re_wintun = Regex::new(r"(?i)Using Wintun device\s+['\x22]?([^'\x22,]+)['\x22]?,?\s*index\s+(\d+)").unwrap();
    let re_ip = Regex::new(r"(?i)(?:Configured as|X-CSTP-Address:|Got IP address|IPv4 address:)\s*([\d.]+)").unwrap();
    let re_mask = Regex::new(r"(?i)(?:X-CSTP-Netmask:|Netmask:)\s*([\d.]+)").unwrap();
    let re_dns = Regex::new(r"(?i)(?:X-CSTP-DNS:|DNS:)\s*([\d.]+)").unwrap();
    let re_server_ip = Regex::new(r"(?i)Connected to\s+([\d.]+):\d+").unwrap();
    let re_mtu = Regex::new(r"(?i)X-CSTP-MTU:\s*(\d+)").unwrap();

    let check_and_apply_routing = {
        let detected_wintun_idx = detected_wintun_idx.clone();
        let detected_wintun_name = detected_wintun_name.clone();
        let detected_vpn_ip = detected_vpn_ip.clone();
        let detected_vpn_mask = detected_vpn_mask.clone();
        let detected_vpn_dns = detected_vpn_dns.clone();
        let detected_server_ip = detected_server_ip.clone();
        let detected_mtu = detected_mtu.clone();
        let routing_applied = routing_applied.clone();
        let orig_gw = orig_gw.clone();
        let profile = profile.clone();
        let app = app.clone();
        let vpn_state_arc = vpn_state_arc.clone();

        Arc::new(move || {
            if routing_applied.load(Ordering::SeqCst) {
                return;
            }

            let d_wintun_idx = detected_wintun_idx.clone();
            let d_wintun_name = detected_wintun_name.clone();
            let d_vpn_ip = detected_vpn_ip.clone();
            let d_vpn_mask = detected_vpn_mask.clone();
            let d_vpn_dns = detected_vpn_dns.clone();
            let d_server_ip = detected_server_ip.clone();
            let d_mtu = detected_mtu.clone();
            let r_applied = routing_applied.clone();
            let orig_gw_c = orig_gw.clone();
            let profile_c = profile.clone();
            let app_c = app.clone();
            let vpn_state_arc_c = vpn_state_arc.clone();

            tokio::spawn(async move {
                // Wait briefly if parameters are still being discovered
                for _ in 0..10 {
                    let ip_opt = d_vpn_ip.lock().await.clone();
                    let idx_opt = d_wintun_idx.lock().await.clone();
                    if ip_opt.is_some() && idx_opt.is_some() {
                        break;
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                }

                if r_applied.swap(true, Ordering::SeqCst) {
                    return;
                }

                let vpn_ip = d_vpn_ip.lock().await.clone().unwrap_or_else(|| "192.168.1.104".into());
                let mut vpn_idx = d_wintun_idx.lock().await.unwrap_or(0);
                let vpn_name = d_wintun_name.lock().await.clone();
                let vpn_mask = d_vpn_mask.lock().await.clone();
                let vpn_dns = d_vpn_dns.lock().await.clone();
                let server_ip = d_server_ip.lock().await.clone();
                let mtu_val = *d_mtu.lock().await;

                if vpn_idx == 0 {
                    if let Some(idx) = find_interface_index_by_name(&vpn_name) {
                        vpn_idx = idx;
                    }
                }

                apply_openconnect_routing(
                    &server_ip,
                    &orig_gw_c,
                    orig_if_idx,
                    vpn_idx,
                    &vpn_name,
                    &vpn_ip,
                    &vpn_mask,
                    &vpn_dns,
                    mtu_val,
                    &profile_c,
                    &app_c,
                );

                // Update private IP in state
                {
                    let mut s = vpn_state_arc_c.lock().await;
                    s.stats.private_ip = vpn_ip.clone();
                    let _ = app_c.emit("vpn:stateChanged", s.clone());
                }
            });
        })
    };

    // Stdout processing
    let app_clone = app.clone();
    let d_wintun_idx1 = detected_wintun_idx.clone();
    let d_wintun_name1 = detected_wintun_name.clone();
    let d_vpn_ip1 = detected_vpn_ip.clone();
    let d_vpn_mask1 = detected_vpn_mask.clone();
    let d_vpn_dns1 = detected_vpn_dns.clone();
    let d_server_ip1 = detected_server_ip.clone();
    let d_mtu1 = detected_mtu.clone();
    let check_routing1 = check_and_apply_routing.clone();

    let re_wintun2 = re_wintun.clone();
    let re_ip2 = re_ip.clone();
    let re_mask2 = re_mask.clone();
    let re_dns2 = re_dns.clone();
    let re_server_ip2 = re_server_ip.clone();
    let re_mtu2 = re_mtu.clone();

    tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                // Parse parameters
                if let Some(caps) = re_wintun.captures(&line) {
                    *d_wintun_name1.lock().await = caps[1].to_string();
                    if let Ok(idx) = caps[2].parse::<u32>() {
                        *d_wintun_idx1.lock().await = Some(idx);
                    }
                }
                if let Some(caps) = re_ip.captures(&line) {
                    *d_vpn_ip1.lock().await = Some(caps[1].to_string());
                }
                if let Some(caps) = re_mask.captures(&line) {
                    *d_vpn_mask1.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_dns.captures(&line) {
                    *d_vpn_dns1.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_server_ip.captures(&line) {
                    *d_server_ip1.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_mtu.captures(&line) {
                    if let Ok(m) = caps[1].parse::<u32>() {
                        *d_mtu1.lock().await = Some(m);
                    }
                }

                if line.contains("CSTP connected") || line.contains("Configured as") || line.contains("Connected as") {
                    check_routing1();
                }

                let _ = app_clone.emit("vpn:log", VpnLog {
                    level: "info".into(),
                    message: line,
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                });
            }
        }
    });

    // Stderr processing
    let app_clone2 = app.clone();
    let d_wintun_idx2 = detected_wintun_idx.clone();
    let d_wintun_name2 = detected_wintun_name.clone();
    let d_vpn_ip2 = detected_vpn_ip.clone();
    let d_vpn_mask2 = detected_vpn_mask.clone();
    let d_vpn_dns2 = detected_vpn_dns.clone();
    let d_server_ip2 = detected_server_ip.clone();
    let d_mtu2 = detected_mtu.clone();
    let check_routing2 = check_and_apply_routing.clone();

    tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if let Some(caps) = re_wintun2.captures(&line) {
                    *d_wintun_name2.lock().await = caps[1].to_string();
                    if let Ok(idx) = caps[2].parse::<u32>() {
                        *d_wintun_idx2.lock().await = Some(idx);
                    }
                }
                if let Some(caps) = re_ip2.captures(&line) {
                    *d_vpn_ip2.lock().await = Some(caps[1].to_string());
                }
                if let Some(caps) = re_mask2.captures(&line) {
                    *d_vpn_mask2.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_dns2.captures(&line) {
                    *d_vpn_dns2.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_server_ip2.captures(&line) {
                    *d_server_ip2.lock().await = caps[1].to_string();
                }
                if let Some(caps) = re_mtu2.captures(&line) {
                    if let Ok(m) = caps[1].parse::<u32>() {
                        *d_mtu2.lock().await = Some(m);
                    }
                }

                if line.contains("CSTP connected") || line.contains("Configured as") || line.contains("Connected as") {
                    check_routing2();
                }

                let _ = app_clone2.emit("vpn:log", VpnLog {
                    level: "warning".into(),
                    message: line,
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                });
            }
        }
    });

    let is_running_clone = is_running.clone();
    let app_clone3 = app.clone();
    let server_ip_for_exit = server_ip_resolved.clone();

    tokio::spawn(async move {
        let status = child.wait().await;
        is_running_clone.store(false, Ordering::SeqCst);
        cleanup_openconnect_routes(Some(&server_ip_for_exit), Some("SecureVPN"));
        let _ = app_clone3.emit("vpn:stateChanged", VpnState {
            status: "disconnected".into(),
            profile: None,
            stats: VpnStats::default(),
        });
        println!("openconnect process exited: {:?}", status);
    });

    Ok(pid)
}
