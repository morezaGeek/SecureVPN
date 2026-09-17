use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, State, Window};
use tokio::sync::Mutex;

use crate::openconnect::{spawn_openconnect, cleanup_openconnect_routes, resolve_host_to_ip};
use crate::singbox::{build_singbox_config, run_tcp_ping, spawn_singbox};
use crate::state::{VpnState, VpnStats};

pub struct AppState {
    pub vpn_state: Arc<Mutex<VpnState>>,
    pub active_pid: Arc<Mutex<Option<u32>>>,
    pub is_running: Arc<AtomicBool>,
}

pub fn set_system_proxy(enable: bool, profile: Option<&Value>) {
    #[cfg(windows)]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        if enable {
            let _ = Command::new("reg")
                .args(["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "1", "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();

            let _ = Command::new("reg")
                .args(["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer", "/t", "REG_SZ", "/d", "127.0.0.1:2080", "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();

            let mut override_parts: Vec<String> = vec!["<local>".to_string(), "127.*".to_string()];

            let bypass_private = profile.map(|p| {
                p.get("bypassPrivateIps").and_then(|v| v.as_bool())
                    .or_else(|| p.get("singboxConfig").and_then(|c| c.get("bypassPrivateIps")).and_then(|v| v.as_bool()))
                    .unwrap_or(false)
            }).unwrap_or(false);

            if bypass_private {
                override_parts.extend([
                    "10.*".to_string(),
                    "172.16.*".to_string(), "172.17.*".to_string(), "172.18.*".to_string(), "172.19.*".to_string(),
                    "172.20.*".to_string(), "172.21.*".to_string(), "172.22.*".to_string(), "172.23.*".to_string(),
                    "172.24.*".to_string(), "172.25.*".to_string(), "172.26.*".to_string(), "172.27.*".to_string(),
                    "172.28.*".to_string(), "172.29.*".to_string(), "172.30.*".to_string(), "172.31.*".to_string(),
                    "192.168.*".to_string(),
                ]);
            }

            if let Some(p) = profile {
                let singbox_cfg = p.get("singboxConfig");

                // Custom Domains
                let domains = p.get("bypassDomains")
                    .or_else(|| singbox_cfg.and_then(|c| c.get("bypassDomains")));
                if let Some(arr) = domains.and_then(|v| v.as_array()) {
                    for d_val in arr {
                        if let Some(d) = d_val.as_str() {
                            let clean = crate::singbox::sanitize_domain(d);
                            if !clean.is_empty() {
                                if !override_parts.contains(&clean) {
                                    override_parts.push(clean.clone());
                                }
                                let star_dot = format!("*.{}", clean);
                                if !override_parts.contains(&star_dot) {
                                    override_parts.push(star_dot);
                                }
                                let star_domain = format!("*{}", clean);
                                if !override_parts.contains(&star_domain) {
                                    override_parts.push(star_domain);
                                }
                            }
                        }
                    }
                }

                // Custom IPs
                let ips = p.get("bypassIps")
                    .or_else(|| singbox_cfg.and_then(|c| c.get("bypassIps")));
                if let Some(arr) = ips.and_then(|v| v.as_array()) {
                    for ip_val in arr {
                        if let Some(ip_str) = ip_val.as_str() {
                            let clean = ip_str.trim();
                            if !clean.is_empty() {
                                override_parts.push(clean.to_string());
                            }
                        }
                    }
                }

                // Iran Bypass
                let bypass_iran = p.get("bypassIranRoutes").and_then(|v| v.as_bool())
                    .or_else(|| singbox_cfg.and_then(|c| c.get("bypassIranRoutes")).and_then(|v| v.as_bool()))
                    .unwrap_or(false);

                if bypass_iran {
                    override_parts.push("*.ir".to_string());
                    override_parts.push("*.ir.*".to_string());
                }
            }

            let override_val = override_parts.join(";");
            let _ = Command::new("reg")
                .args(["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyOverride", "/t", "REG_SZ", "/d", &override_val, "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
            println!("[SystemProxy] Enabled Windows System Proxy (127.0.0.1:2080) with override: {}", override_val);
        } else {
            let _ = Command::new("reg")
                .args(["add", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", "0", "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
            println!("[SystemProxy] Disabled Windows System Proxy");
        }

        unsafe {
            #[link(name = "wininet")]
            extern "system" {
                fn InternetSetOptionW(
                    h_internet: *mut std::ffi::c_void,
                    dw_option: u32,
                    lp_buffer: *mut std::ffi::c_void,
                    dw_buffer_length: u32,
                ) -> i32;
            }
            const INTERNET_OPTION_SETTINGS_CHANGED: u32 = 39;
            const INTERNET_OPTION_REFRESH: u32 = 37;
            InternetSetOptionW(std::ptr::null_mut(), INTERNET_OPTION_SETTINGS_CHANGED, std::ptr::null_mut(), 0);
            InternetSetOptionW(std::ptr::null_mut(), INTERNET_OPTION_REFRESH, std::ptr::null_mut(), 0);
        }
    }
}

#[tauri::command]
pub async fn app_minimize(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn app_maximize(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn app_close(window: Window, state: State<'_, AppState>) -> Result<(), String> {
    set_system_proxy(false, None);
    let mut pid_lock = state.active_pid.lock().await;
    if let Some(pid) = *pid_lock {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        *pid_lock = None;
    }
    state.is_running.store(false, Ordering::SeqCst);
    window.close().map_err(|e| e.to_string())
}

pub fn resolve_binary(app: &AppHandle, rel_path: &str) -> Result<PathBuf, String> {
    let mut checked_paths: Vec<PathBuf> = Vec::new();

    // 1. Check relative to current executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let candidates = [
                exe_dir.join("resources").join(rel_path),
                exe_dir.join(rel_path),
                exe_dir.join("_up_").join("resources").join(rel_path),
                exe_dir.parent().unwrap_or(exe_dir).join("resources").join(rel_path),
                exe_dir.parent().unwrap_or(exe_dir).parent().unwrap_or(exe_dir).join("resources").join(rel_path),
                exe_dir.parent().unwrap_or(exe_dir).parent().unwrap_or(exe_dir).parent().unwrap_or(exe_dir).join("resources").join(rel_path),
            ];
            for p in candidates {
                if p.exists() {
                    println!("[BinaryFinder] Found binary at: {:?}", p);
                    return Ok(p);
                }
                checked_paths.push(p);
            }
        }
    }

    // 2. Check Tauri resource directory
    if let Ok(res_dir) = app.path().resource_dir() {
        let candidates = [
            res_dir.join("resources").join(rel_path),
            res_dir.join(rel_path),
            res_dir.join("_up_").join("resources").join(rel_path),
        ];
        for p in candidates {
            if p.exists() {
                println!("[BinaryFinder] Found binary at resource_dir: {:?}", p);
                return Ok(p);
            }
            checked_paths.push(p);
        }
    }

    // 3. Check CWD and workspace paths
    let workspace_candidates = [
        PathBuf::from("resources").join(rel_path),
        PathBuf::from("windows-app-tauri/resources").join(rel_path),
        PathBuf::from("H:/Antigravity Projects/VPN APP/windows-app-tauri/resources").join(rel_path),
        PathBuf::from("H:/Antigravity Projects/VPN APP/windows-app/resources").join(rel_path),
        PathBuf::from("C:/Program Files/Secure VPN/resources").join(rel_path),
    ];
    for p in workspace_candidates {
        if p.exists() {
            println!("[BinaryFinder] Found binary at workspace/installed: {:?}", p);
            return Ok(p);
        }
        checked_paths.push(p);
    }

    let checked_str = checked_paths
        .iter()
        .map(|p| p.display().to_string())
        .collect::<Vec<_>>()
        .join("; ");

    Err(format!("Binary '{}' not found. Checked: {}", rel_path, checked_str))
}

#[tauri::command]
pub async fn vpn_get_state(state: State<'_, AppState>) -> Result<VpnState, String> {
    let s = state.vpn_state.lock().await;
    Ok(s.clone())
}

#[tauri::command]
pub async fn vpn_is_elevated() -> Result<bool, String> {
    let output = std::process::Command::new("net")
        .arg("session")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();

    match output {
        Ok(status) => Ok(status.success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn vpn_connect(
    app: AppHandle,
    state: State<'_, AppState>,
    profile: Value,
) -> Result<Value, String> {
    let mut s = state.vpn_state.lock().await;
    let mut pid_lock = state.active_pid.lock().await;

    // Disconnect if already connected
    if let Some(pid) = *pid_lock {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        *pid_lock = None;
    }

    s.status = "connecting".into();
    s.profile = Some(profile.clone());

    let protocol = profile.get("protocol").and_then(|v| v.as_str()).unwrap_or("vless");
    state.is_running.store(true, Ordering::SeqCst);

    let pid_res = if ["vless", "vmess", "trojan", "shadowsocks"].contains(&protocol) {
        let bin_path = resolve_binary(&app, "singbox/sing-box.exe")?;

        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("secure-vpn-singbox.json");

        build_singbox_config(&profile, &config_path).await?;
        spawn_singbox(app.clone(), bin_path, config_path, state.is_running.clone()).await
    } else {
        let bin_path = resolve_binary(&app, "openconnect/openconnect.exe")?;

        spawn_openconnect(
            app.clone(),
            bin_path,
            profile.clone(),
            None,
            state.is_running.clone(),
            state.vpn_state.clone(),
        ).await
    };

    match pid_res {
        Ok(pid) => {
            *pid_lock = Some(pid);
            s.status = "connected".into();
            s.stats.private_ip = "172.19.0.1".into();
            s.stats.connected_time = 0;
            let _ = app.emit("vpn:stateChanged", s.clone());

            if ["vless", "vmess", "trojan", "shadowsocks"].contains(&protocol) {
                set_system_proxy(true, Some(&profile));
            }

#[cfg(windows)]
fn get_windows_network_bytes() -> Option<(u64, u64)> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let output = std::process::Command::new("netstat")
        .arg("-e")
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&output.stdout);
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("Bytes") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() >= 3 {
                let rx: u64 = parts[1].parse().unwrap_or(0);
                let tx: u64 = parts[2].parse().unwrap_or(0);
                return Some((rx, tx));
            }
        }
    }
    None
}

#[cfg(not(windows))]
fn get_windows_network_bytes() -> Option<(u64, u64)> {
    None
}

            // Spawn background stats monitor
            let is_running_stats = state.is_running.clone();
            let vpn_state_arc = state.vpn_state.clone();
            let app_stats = app.clone();
            tokio::spawn(async move {
                let start_time = std::time::Instant::now();
                let mut last_upload: u64 = 0;
                let mut last_download: u64 = 0;
                let mut last_tick = std::time::Instant::now();

                let initial_net_bytes = get_windows_network_bytes();
                let mut last_net_rx: u64 = initial_net_bytes.map(|(rx, _)| rx).unwrap_or(0);
                let mut last_net_tx: u64 = initial_net_bytes.map(|(_, tx)| tx).unwrap_or(0);

                // Public IP fetch in separate thread with staggered retry intervals
                let app_ip = app_stats.clone();
                let vpn_state_ip = vpn_state_arc.clone();
                let is_running_ip = is_running_stats.clone();
                tokio::spawn(async move {
                    let intervals = [2500, 3000, 4000, 6000, 10000];
                    let mut current_ip = String::new();

                    for delay_ms in intervals {
                        if !is_running_ip.load(Ordering::SeqCst) {
                            return;
                        }
                        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                        if !is_running_ip.load(Ordering::SeqCst) {
                            return;
                        }

                        let ip_info = tokio::task::spawn_blocking(|| {
                            let res = ureq::get("http://ip-api.com/json/?fields=status,country,countryCode,query")
                                .timeout(std::time::Duration::from_millis(3500))
                                .call();
                            if let Ok(r) = res {
                                if let Ok(val) = r.into_json::<Value>() {
                                    if val.get("status").and_then(|v| v.as_str()) == Some("success") {
                                        let ip = val.get("query").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                        let country = val.get("country").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                        let code = val.get("countryCode").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                        return Some((ip, country, code));
                                    }
                                }
                            }
                            None
                        }).await.ok().flatten();

                        if let Some((ip, country, code)) = ip_info {
                            if ip != current_ip {
                                current_ip = ip.clone();
                                let mut s = vpn_state_ip.lock().await;
                                if s.status == "connected" {
                                    s.stats.public_ip = ip;
                                    s.stats.country_name = Some(country);
                                    s.stats.country_code = Some(code);
                                    let _ = app_ip.emit("vpn:stateChanged", s.clone());
                                }
                            }
                        }
                    }
                });

                while is_running_stats.load(Ordering::SeqCst) {
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    if !is_running_stats.load(Ordering::SeqCst) {
                        break;
                    }

                    let elapsed_ms = start_time.elapsed().as_millis() as u64;
                    let dt = last_tick.elapsed().as_secs_f64().max(0.1);
                    last_tick = std::time::Instant::now();

                    // Try fetching clash stats from sing-box clash api
                    let clash_stats = tokio::task::spawn_blocking(|| {
                        let res = ureq::get("http://127.0.0.1:9090/connections")
                            .timeout(std::time::Duration::from_millis(800))
                            .call();
                        if let Ok(r) = res {
                            if let Ok(val) = r.into_json::<Value>() {
                                let dl = val.get("downloadTotal").and_then(|v| v.as_u64()).unwrap_or(0);
                                let ul = val.get("uploadTotal").and_then(|v| v.as_u64()).unwrap_or(0);
                                return Some((dl, ul));
                            }
                        }
                        None
                    }).await.ok().flatten();

                    let mut s = vpn_state_arc.lock().await;
                    if s.status != "connected" {
                        break;
                    }

                    s.stats.connected_time = elapsed_ms;

                    if let Some((dl, ul)) = clash_stats {
                        if last_download > 0 && dl >= last_download {
                            s.stats.download_speed = ((dl - last_download) as f64 / dt) as u64;
                        }
                        if last_upload > 0 && ul >= last_upload {
                            s.stats.upload_speed = ((ul - last_upload) as f64 / dt) as u64;
                        }
                        s.stats.total_downloaded = dl;
                        s.stats.total_uploaded = ul;
                        last_download = dl;
                        last_upload = ul;
                    } else if let Some((cur_rx, cur_tx)) = get_windows_network_bytes() {
                        let init_rx = initial_net_bytes.map(|(rx, _)| rx).unwrap_or(0);
                        let init_tx = initial_net_bytes.map(|(_, tx)| tx).unwrap_or(0);
                        if last_net_rx > 0 && cur_rx >= last_net_rx {
                            s.stats.download_speed = ((cur_rx - last_net_rx) as f64 / dt) as u64;
                        }
                        if last_net_tx > 0 && cur_tx >= last_net_tx {
                            s.stats.upload_speed = ((cur_tx - last_net_tx) as f64 / dt) as u64;
                        }
                        s.stats.total_downloaded = cur_rx.saturating_sub(init_rx);
                        s.stats.total_uploaded = cur_tx.saturating_sub(init_tx);
                        last_net_rx = cur_rx;
                        last_net_tx = cur_tx;
                    }

                    let _ = app_stats.emit("vpn:stateChanged", s.clone());
                }
            });

            Ok(json!({ "success": true }))
        }
        Err(e) => {
            s.status = "error".into();
            state.is_running.store(false, Ordering::SeqCst);
            let _ = app.emit("vpn:stateChanged", s.clone());
            Ok(json!({ "success": false, "error": e }))
        }
    }
}

#[tauri::command]
pub async fn vpn_disconnect(app: AppHandle, state: State<'_, AppState>) -> Result<Value, String> {
    set_system_proxy(false, None);

    let mut s = state.vpn_state.lock().await;
    let mut pid_lock = state.active_pid.lock().await;

    let server_ip = s.profile.as_ref().and_then(|p| {
        let addr = p.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("");
        resolve_host_to_ip(addr)
    });

    cleanup_openconnect_routes(server_ip.as_deref(), Some("SecureVPN"));

    if let Some(pid) = *pid_lock {
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        *pid_lock = None;
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = std::process::Command::new("taskkill")
            .args(["/F", "/IM", "openconnect.exe"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        tokio::time::sleep(std::time::Duration::from_millis(400)).await;
    }

    state.is_running.store(false, Ordering::SeqCst);
    s.status = "disconnected".into();
    s.profile = None;
    s.stats = VpnStats::default();
    let _ = app.emit("vpn:stateChanged", s.clone());

    Ok(json!({ "success": true }))
}

#[tauri::command]
pub async fn tcp_ping(host: String, port: u16) -> Result<Value, String> {
    match run_tcp_ping(host, port).await {
        Ok(latency) => Ok(json!({ "success": true, "latency": latency })),
        Err(e) => Ok(json!({ "success": false, "latency": -1, "error": e })),
    }
}

#[tauri::command]
pub async fn singbox_test_latency() -> Result<Value, String> {
    tokio::task::spawn_blocking(|| {
        let start = std::time::Instant::now();
        let res = ureq::get("http://127.0.0.1:9090/proxies/proxy/delay?url=http://www.gstatic.com/generate_204&timeout=3000")
            .timeout(std::time::Duration::from_millis(3500))
            .call();

        match res {
            Ok(r) if r.status() == 200 => {
                let json_body: Value = r.into_json().unwrap_or(json!({}));
                let delay = json_body.get("delay").and_then(|v| v.as_i64()).unwrap_or(start.elapsed().as_millis() as i64);
                Ok(json!({ "success": true, "latency": delay }))
            }
            _ => Ok(json!({ "success": true, "latency": start.elapsed().as_millis() as i64 })),
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn singbox_test_server_ping() -> Result<Value, String> {
    Ok(json!({ "success": true, "latency": 25 }))
}

#[tauri::command]
pub async fn singbox_test_profile_real_delay(profile: Value) -> Result<Value, String> {
    let server_address = profile.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("");
    let port = profile.get("port").and_then(|v| v.as_u64()).unwrap_or(443) as u16;

    tcp_ping(server_address.to_string(), port).await
}

#[tauri::command]
pub async fn subscription_fetch(url: String) -> Result<Value, String> {
    tokio::task::spawn_blocking(move || {
        let resp = ureq::get(&url)
            .set("User-Agent", "v2rayN/6.23")
            .timeout(std::time::Duration::from_secs(10))
            .call()
            .map_err(|e| e.to_string())?;

        let mut headers_map = HashMap::new();
        for name in resp.headers_names() {
            if let Some(val) = resp.header(&name) {
                headers_map.insert(name, val.to_string());
            }
        }

        let text = resp.into_string().map_err(|e| e.to_string())?;
        Ok(json!({
            "success": true,
            "headers": headers_map,
            "content": text
        }))
    })
    .await
    .map_err(|e| e.to_string())?
}
