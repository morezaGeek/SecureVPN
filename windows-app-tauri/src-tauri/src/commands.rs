use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, State, Window};
use tokio::sync::Mutex;

use crate::openconnect::{spawn_openconnect, cleanup_openconnect_routes, resolve_host_to_ip};
use crate::singbox::{build_singbox_batch_test_config, build_singbox_config, run_tcp_ping, spawn_singbox};
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
pub async fn http_ping(host: String, port: u16, tls: Option<bool>, sni: Option<String>) -> Result<Value, String> {
    let host_clone = host.clone();
    let res = tokio::task::spawn_blocking(move || {
        let is_tls = tls.unwrap_or(port == 443);
        let scheme = if is_tls { "https" } else { "http" };
        let req_host = sni.as_deref().filter(|s| !s.is_empty()).unwrap_or(&host);
        let url = format!("{}://{}:{}/", scheme, req_host, port);
        let start = std::time::Instant::now();
        
        let res = ureq::head(&url)
            .timeout(std::time::Duration::from_millis(2000))
            .call();

        match res {
            Ok(_) | Err(ureq::Error::Status(_, _)) => {
                let ms = start.elapsed().as_millis() as i64;
                Ok(ms)
            }
            Err(_) => {
                let get_res = ureq::get(&url)
                    .timeout(std::time::Duration::from_millis(1500))
                    .call();

                match get_res {
                    Ok(_) | Err(ureq::Error::Status(_, _)) => {
                        let ms = start.elapsed().as_millis() as i64;
                        Ok(ms)
                    }
                    Err(e) => Err(e.to_string()),
                }
            }
        }
    })
    .await
    .map_err(|e| e.to_string())?;

    match res {
        Ok(ms) => Ok(json!({ "success": true, "latency": ms })),
        Err(_) => {
            // Fallback to TCP ping if HTTP protocol probe was dropped/refused
            match run_tcp_ping(host_clone, port).await {
                Ok(ms) => Ok(json!({ "success": true, "latency": ms })),
                Err(e) => Ok(json!({ "success": false, "latency": -1, "error": e })),
            }
        }
    }
}

#[tauri::command]
pub async fn singbox_test_latency() -> Result<Value, String> {
    let proxy = match reqwest::Proxy::all("http://127.0.0.1:2080") {
        Ok(p) => p,
        Err(_) => return Ok(json!({ "success": false, "latency": -1 })),
    };
    let client = match reqwest::Client::builder()
        .proxy(proxy)
        .timeout(std::time::Duration::from_millis(5000))
        .connect_timeout(std::time::Duration::from_millis(4500))
        .build() {
            Ok(c) => c,
            Err(_) => return Ok(json!({ "success": false, "latency": -1 })),
        };

    let mut latencies: Vec<i64> = Vec::new();
    for _ in 0..2 {
        let start = std::time::Instant::now();
        match client.get("https://www.google.com/generate_204").send().await {
            Ok(resp) => {
                let s = resp.status();
                let _ = resp.bytes().await;
                let elapsed = start.elapsed().as_millis() as i64;
                if s.as_u16() == 204 || s.is_success() {
                    latencies.push(elapsed);
                }
            }
            Err(_) => {}
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    if latencies.len() == 1 && latencies[0] > 250 {
        let start = std::time::Instant::now();
        if let Ok(resp) = client.get("https://www.google.com/generate_204").send().await {
            let s = resp.status();
            let _ = resp.bytes().await;
            let elapsed = start.elapsed().as_millis() as i64;
            if s.as_u16() == 204 || s.is_success() {
                latencies.push(elapsed);
            }
        }
    }

    let min_ms = latencies.into_iter().min().unwrap_or(-1);
    if min_ms > 0 {
        Ok(json!({ "success": true, "latency": min_ms }))
    } else {
        Ok(json!({ "success": false, "latency": -1 }))
    }
}

#[tauri::command]
pub async fn singbox_test_server_ping() -> Result<Value, String> {
    Ok(json!({ "success": true, "latency": 25 }))
}

fn find_available_port_range(start_port: u16, count: u16) -> u16 {
    'outer: for base in (start_port..start_port + 500).step_by(1) {
        for offset in 0..count {
            if std::net::TcpListener::bind(("127.0.0.1", base + offset)).is_err() {
                continue 'outer;
            }
        }
        return base;
    }
    start_port
}

#[tauri::command]
pub async fn singbox_batch_real_delay(
    app: AppHandle,
    profiles: Vec<Value>,
    test_url: Option<String>,
) -> Result<HashMap<String, i64>, String> {
    let mut results: HashMap<String, i64> = HashMap::new();
    let mut sb_profiles = Vec::new();

    // Handle OpenConnect profiles via direct TCP ping
    for p in &profiles {
        let protocol = p.get("protocol").and_then(|v| v.as_str()).unwrap_or("");
        let id = p.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        if protocol == "openconnect" {
            let host = p.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let port = p.get("port").and_then(|v| v.as_u64()).unwrap_or(443) as u16;
            let latency = match run_tcp_ping(host, port).await {
                Ok(ms) => ms,
                Err(_) => -1,
            };
            results.insert(id.clone(), latency);
            let _ = app.emit("vpn:pingResult", json!({
                "profileId": id,
                "latency": latency,
                "mode": "real"
            }));
        } else if ["vless", "vmess", "trojan", "shadowsocks"].contains(&protocol) {
            sb_profiles.push(p.clone());
        }
    }

    if sb_profiles.is_empty() {
        return Ok(results);
    }

    let bin_path = resolve_binary(&app, "singbox/sing-box.exe")?;
    let temp_dir = std::env::temp_dir();
    let unique_id = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos();
    let config_path = temp_dir.join(format!("sb-batch-{}.json", unique_id));

    let base_port = find_available_port_range(11000, sb_profiles.len() as u16 + 5);
    let port_map = build_singbox_batch_test_config(&sb_profiles, &config_path, base_port).await?;

    #[cfg(windows)]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut cmd = tokio::process::Command::new(&bin_path);
    cmd.args(["run", "-c", config_path.to_str().unwrap_or("")])
       .stdout(std::process::Stdio::null())
       .stderr(std::process::Stdio::null());

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn sing-box test runner: {}", e))?;

    // Wait for inbounds to become ready
    let first_port = port_map.first().map(|(_, p)| *p).unwrap_or(base_port);
    let mut ready = false;
    for _ in 0..40 {
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        if std::net::TcpStream::connect(("127.0.0.1", first_port)).is_ok() {
            ready = true;
            break;
        }
    }

    if !ready {
        let _ = child.kill().await;
        let _ = std::fs::remove_file(&config_path);
        return Err("sing-box test runner failed to start listeners".into());
    }

    let target_url = test_url
        .map(|u| u.trim().to_string())
        .filter(|u| !u.is_empty())
        .unwrap_or_else(|| "https://www.google.com/generate_204".to_string());

    // Force https to prevent ISP / DPI interception and 301 redirects on port 80
    let target_url = if !target_url.starts_with("http://") && !target_url.starts_with("https://") {
        format!("https://{}", target_url)
    } else if target_url.starts_with("http://") {
        target_url.replacen("http://", "https://", 1)
    } else {
        target_url
    };

    let sem = std::sync::Arc::new(tokio::sync::Semaphore::new(3));
    let mut set = tokio::task::JoinSet::new();

    for (profile_id, port) in port_map {
        // Stagger each probe by 80ms to avoid network burst congestion and false high pings
        tokio::time::sleep(std::time::Duration::from_millis(80)).await;

        let sem_clone = sem.clone();
        let app_clone = app.clone();
        let url_str = target_url.clone();

        set.spawn(async move {
            let _permit = sem_clone.acquire_owned().await;

            let proxy_url = format!("http://127.0.0.1:{}", port);
            let proxy = match reqwest::Proxy::all(&proxy_url) {
                Ok(p) => p,
                Err(_) => {
                    let _ = app_clone.emit("vpn:pingResult", json!({
                        "profileId": profile_id,
                        "latency": -1,
                        "mode": "real"
                    }));
                    return (profile_id, -1);
                }
            };

            let client = match reqwest::Client::builder()
                .proxy(proxy)
                .timeout(std::time::Duration::from_millis(5000))
                .connect_timeout(std::time::Duration::from_millis(4500))
                .build() {
                    Ok(c) => c,
                    Err(_) => {
                        let _ = app_clone.emit("vpn:pingResult", json!({
                            "profileId": profile_id,
                            "latency": -1,
                            "mode": "real"
                        }));
                        return (profile_id, -1);
                    }
                };

            let mut latencies: Vec<i64> = Vec::new();

            for _ in 0..2 {
                let start = std::time::Instant::now();
                match client.get(&url_str).send().await {
                    Ok(resp) => {
                        let status = resp.status();
                        let _ = resp.bytes().await;
                        let elapsed = start.elapsed().as_millis() as i64;
                        if status.as_u16() == 204 || status.is_success() {
                            latencies.push(elapsed);
                        }
                    }
                    Err(_) => {}
                }
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }

            // Warm connection probe if only cold dial was recorded
            if latencies.len() == 1 && latencies[0] > 250 {
                let start = std::time::Instant::now();
                if let Ok(resp) = client.get(&url_str).send().await {
                    let status = resp.status();
                    let _ = resp.bytes().await;
                    let elapsed = start.elapsed().as_millis() as i64;
                    if status.as_u16() == 204 || status.is_success() {
                        latencies.push(elapsed);
                    }
                }
            }

            let min_ms = latencies.into_iter().min().unwrap_or(-1);

            let _ = app_clone.emit("vpn:pingResult", json!({
                "profileId": profile_id,
                "latency": min_ms,
                "mode": "real"
            }));

            (profile_id, min_ms)
        });
    }

    while let Some(res) = set.join_next().await {
        if let Ok((profile_id, latency)) = res {
            results.insert(profile_id, latency);
        }
    }

    let _ = child.kill().await;
    let _ = std::fs::remove_file(&config_path);

    Ok(results)
}

#[tauri::command]
pub async fn singbox_test_profile_real_delay(app: AppHandle, profile: Value, test_url: Option<String>) -> Result<Value, String> {
    let id = profile.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let batch_res = singbox_batch_real_delay(app, vec![profile], test_url).await?;
    let latency = batch_res.get(&id).copied().unwrap_or(-1);
    if latency > 0 {
        Ok(json!({ "success": true, "latency": latency }))
    } else {
        Ok(json!({ "success": false, "latency": -1, "error": "Timeout or connection failed" }))
    }
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

#[tauri::command]
pub async fn tray_update_menu(
    app: AppHandle,
    profiles: Vec<Value>,
    is_connected: bool,
    current_profile_id: Option<String>,
) -> Result<(), String> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu, IsMenuItem};

    let tray = match app.tray_by_id("main-tray") {
        Some(t) => t,
        None => return Ok(()),
    };

    let start_item = MenuItem::with_id(&app, "start_vpn", "Start VPN", !is_connected, None::<&str>)
        .map_err(|e| e.to_string())?;
    let stop_item = MenuItem::with_id(&app, "stop_vpn", "Stop VPN", is_connected, None::<&str>)
        .map_err(|e| e.to_string())?;

    let sep1 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    let sep2 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;

    // Build items for the "Connect" submenu
    let mut profile_menu_items = Vec::new();
    if profiles.is_empty() {
        let empty_item = MenuItem::with_id(&app, "no_profiles", "No profiles configured", false, None::<&str>)
            .map_err(|e| e.to_string())?;
        profile_menu_items.push(empty_item);
    } else {
        for p in &profiles {
            let id = p.get("id").and_then(|v| v.as_str()).unwrap_or("");
            let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("Server");
            let proto = p.get("protocol").and_then(|v| v.as_str()).unwrap_or("");
            
            let is_active = current_profile_id.as_deref() == Some(id);
            let prefix = if is_active && is_connected {
                "● "
            } else if is_active {
                "► "
            } else {
                "   "
            };
            let label = if proto.is_empty() {
                format!("{}{}", prefix, name)
            } else {
                format!("{}{}{}", prefix, name, format!(" ({})", proto.to_uppercase()))
            };

            if let Ok(item) = MenuItem::with_id(&app, format!("profile:{}", id), label, true, None::<&str>) {
                profile_menu_items.push(item);
            }
        }
    }

    let profile_refs: Vec<&dyn IsMenuItem<tauri::Wry>> = profile_menu_items.iter().map(|i| i as &dyn IsMenuItem<tauri::Wry>).collect();
    let connect_submenu = Submenu::with_items(&app, "Connect", true, &profile_refs)
        .map_err(|e| e.to_string())?;

    let show_item = MenuItem::with_id(&app, "show", "Show Secure VPN", true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let quit_item = MenuItem::with_id(&app, "quit", "Quit", true, None::<&str>)
        .map_err(|e| e.to_string())?;

    let menu_items: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![
        &start_item,
        &stop_item,
        &sep1,
        &connect_submenu,
        &sep2,
        &show_item,
        &quit_item,
    ];

    let new_menu = Menu::with_items(&app, &menu_items).map_err(|e| e.to_string())?;
    tray.set_menu(Some(new_menu)).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        let _ = std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", &url])
            .spawn();
    }
    #[cfg(not(windows))]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn();
    }
    Ok(())
}


