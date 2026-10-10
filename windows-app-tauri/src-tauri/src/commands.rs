use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
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
    pub session: Arc<AtomicU64>,
}

pub use crate::system_proxy::clear_app_system_proxy;

fn hidden_command(program: &str) -> std::process::Command {
    let mut command = std::process::Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    command
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
    clear_app_system_proxy();
    let mut pid_lock = state.active_pid.lock().await;
    if let Some(pid) = *pid_lock {
        let _ = hidden_command("taskkill")
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
    let output = hidden_command("net")
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
    if app.state::<crate::updater::UpdateState>().installing.load(Ordering::SeqCst) {
        return Ok(json!({ "success": false, "error": "Update installation is starting" }));
    }
    let mut pid_lock = state.active_pid.lock().await;

    // Disconnect if already connected
    if let Some(pid) = *pid_lock {
        let _ = hidden_command("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        *pid_lock = None;
    }

    let session = state.session.fetch_add(1, Ordering::SeqCst) + 1;
    s.stats = VpnStats::default();
    s.status = "connecting".into();
    s.profile = Some(profile.clone());

    let protocol = profile.get("protocol").and_then(|v| v.as_str()).unwrap_or("vless");
    state.is_running.store(true, Ordering::SeqCst);

    // Route setup/validation errors through the same state cleanup as spawn errors.
    let pid_res = async { if ["vless", "vmess", "trojan", "shadowsocks", "hysteria2"].contains(&protocol) {
        let bin_path = resolve_binary(&app, "singbox/sing-box.exe")?;

        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("secure-vpn-singbox.json");

        build_singbox_config(&profile, &config_path).await?;
        spawn_singbox(app.clone(), bin_path, config_path, state.is_running.clone(), state.vpn_state.clone(), state.session.clone(), session).await
    } else {
        let bin_path = resolve_binary(&app, "openconnect/openconnect.exe")?;

        spawn_openconnect(
            app.clone(),
            bin_path,
            profile.clone(),
            None,
            state.is_running.clone(),
            state.vpn_state.clone(),
            state.session.clone(), session,
        ).await
    } }.await;

    match pid_res {
        Ok(pid) => {
            *pid_lock = Some(pid);
            s.status = "connected".into();
            s.stats.private_ip = "172.19.0.1".into();
            s.stats.connected_time = 0;
            let _ = app.emit("vpn:stateChanged", s.clone());

            if ["vless", "vmess", "trojan", "shadowsocks", "hysteria2"].contains(&protocol) {
                clear_app_system_proxy();
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
            let session_stats = state.session.clone();
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
                let session_ip = session_stats.clone();
                tokio::spawn(async move {
                    let intervals = [2500, 3000, 4000, 6000, 10000];
                    let mut current_ip = String::new();

                    for delay_ms in intervals {
                        if !is_running_ip.load(Ordering::SeqCst) || session_ip.load(Ordering::SeqCst) != session {
                            return;
                        }
                        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                        if !is_running_ip.load(Ordering::SeqCst) || session_ip.load(Ordering::SeqCst) != session {
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
                                if s.status == "connected" && session_ip.load(Ordering::SeqCst) == session {
                                    s.stats.public_ip = ip;
                                    s.stats.country_name = Some(country);
                                    s.stats.country_code = Some(code);
                                    let _ = app_ip.emit("vpn:stateChanged", s.clone());
                                }
                            }
                        }
                    }
                });

                while is_running_stats.load(Ordering::SeqCst) && session_stats.load(Ordering::SeqCst) == session {
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    if !is_running_stats.load(Ordering::SeqCst) || session_stats.load(Ordering::SeqCst) != session {
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
                    if s.status != "connected" || session_stats.load(Ordering::SeqCst) != session {
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
    clear_app_system_proxy();

    let mut s = state.vpn_state.lock().await;
    let mut pid_lock = state.active_pid.lock().await;

    let server_ip = s.profile.as_ref().and_then(|p| {
        let addr = p.get("serverAddress").and_then(|v| v.as_str()).unwrap_or("");
        resolve_host_to_ip(addr)
    });

    cleanup_openconnect_routes(server_ip.as_deref(), Some("SecureVPN"));

    if let Some(pid) = *pid_lock {
        let _ = hidden_command("taskkill")
            .args(["/F", "/T", "/PID", &pid.to_string()])
            .output();
        *pid_lock = None;
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = hidden_command("taskkill")
            .args(["/F", "/IM", "openconnect.exe"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        tokio::time::sleep(std::time::Duration::from_millis(400)).await;
    }

    state.session.fetch_add(1, Ordering::SeqCst);
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

pub struct PingTestState {
    gate: Mutex<()>,
    generation: AtomicU64,
    live_gate: Mutex<()>,
    live_client: Mutex<Option<(u32, reqwest::Client)>>,
}

impl Default for PingTestState {
    fn default() -> Self {
        Self { gate: Mutex::new(()), generation: AtomicU64::new(0),
            live_gate: Mutex::new(()), live_client: Mutex::new(None) }
    }
}

#[tauri::command]
pub async fn cancel_ping_tests(pings: State<'_, PingTestState>) -> Result<(), String> {
    stop_ping_tests(&pings).await;
    Ok(())
}

async fn stop_ping_tests(pings: &PingTestState) {
    pings.generation.fetch_add(1, Ordering::SeqCst);
    // Return only after the runner has stopped and removed its private config.
    let _guard = pings.gate.lock().await;
}

#[tauri::command]
pub async fn singbox_test_latency(state: State<'_, AppState>, pings: State<'_, PingTestState>) -> Result<Value, String> {
    // Serialize across reconnects too; the old session releases this lock as
    // soon as its PID/status changes, so a fresh automatic probe can proceed.
    let _guard = pings.live_gate.lock().await;
    let pid = (*state.active_pid.lock().await).ok_or("VPN is disconnected")?;
    if state.vpn_state.lock().await.status != "connected" { return Err("VPN is disconnected".into()); }
    let client = {
        let mut cache = pings.live_client.lock().await;
        if cache.as_ref().map(|(cached,_)| *cached) != Some(pid) {
            *cache = Some((pid, crate::latency::proxy_client(2080)?));
        }
        cache.as_ref().unwrap().1.clone()
    };
    let targets = crate::latency::targets(None);
    let result = tokio::select! {
        result = crate::latency::measure(&client, &targets) => result,
        _ = async {
            loop {
                tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                if *state.active_pid.lock().await != Some(pid) || state.vpn_state.lock().await.status != "connected" { break; }
            }
        } => return Err("VPN connection changed".into()),
    };
    if *state.active_pid.lock().await != Some(pid) { return Err("VPN connection changed".into()); }
    match result {
        Ok(ms) => Ok(json!({"success":true,"latency":ms})),
        Err(e) => Ok(json!({"success":false,"latency":-1,"error":e})),
    }
}

#[tauri::command]
pub async fn singbox_test_server_ping(state: State<'_, AppState>) -> Result<Value, String> {
    let profile = state.vpn_state.lock().await.profile.clone().ok_or("No active profile")?;
    let host = profile["serverAddress"].as_str().ok_or("Missing server")?.to_owned();
    let port = profile["port"].as_u64().unwrap_or(443) as u16;
    match run_tcp_ping(host,port).await {
        Ok(ms) => Ok(json!({"success":true,"latency":ms})),
        Err(e) => Ok(json!({"success":false,"latency":-1,"error":e})),
    }
}

fn find_available_port_range(start_port: u16, count: u16) -> Result<u16, String> {
    if count == 0 || count > 500 { return Err("Too many test profiles".into()); }
    'outer: for base in start_port..start_port + 500 {
        for offset in 0..count {
            if std::net::TcpListener::bind(("127.0.0.1", base + offset)).is_err() { continue 'outer; }
        }
        return Ok(base);
    }
    Err("No available test ports".into())
}

struct TestConfig(PathBuf);
impl Drop for TestConfig {
    fn drop(&mut self) { let _ = std::fs::remove_file(&self.0); }
}

#[cfg(test)]
mod ping_tests {
    use super::*;

    #[tokio::test]
    async fn cancellation_waits_for_runner_cleanup_before_allowing_restart() {
        let pings = Arc::new(PingTestState::default());
        let guard = pings.gate.lock().await;
        let generation = pings.generation.load(Ordering::SeqCst);
        let owned = pings.clone();
        let mut cancellation = tokio::spawn(async move { stop_ping_tests(&owned).await; });
        tokio::time::timeout(std::time::Duration::from_millis(200),cancelled(&pings,generation)).await.unwrap();
        assert!(tokio::time::timeout(std::time::Duration::from_millis(20),&mut cancellation).await.is_err());
        assert!(pings.gate.try_lock().is_err());
        drop(guard);
        cancellation.await.unwrap();
        assert!(pings.gate.try_lock().is_ok());
    }

    #[test]
    fn invalid_port_range_never_silently_reuses_a_busy_range() {
        assert!(find_available_port_range(11000,0).is_err());
        assert!(find_available_port_range(11000,501).is_err());
    }
}

async fn cancelled(pings: &PingTestState, generation: u64) {
    while pings.generation.load(Ordering::SeqCst) == generation {
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
}

#[tauri::command]
pub async fn singbox_batch_real_delay(
    app: AppHandle, pings: State<'_, PingTestState>, profiles: Vec<Value>,
    test_url: Option<String>, request_id: Option<String>,
) -> Result<HashMap<String, i64>, String> {
    batch_real_delay(&app, &pings, profiles, test_url, request_id).await
}

async fn batch_real_delay(app: &AppHandle, pings: &PingTestState, profiles: Vec<Value>, test_url: Option<String>, request_id: Option<String>) -> Result<HashMap<String, i64>, String> {
    let _guard = pings.gate.try_lock().map_err(|_| "Another ping test is running")?;
    let generation = pings.generation.load(Ordering::SeqCst);
    let mut results = HashMap::new();
    let sb_profiles: Vec<_> = profiles.iter().filter(|p| ["vless","vmess","trojan","shadowsocks","hysteria2"].contains(&p["protocol"].as_str().unwrap_or(""))).cloned().collect();
    let mut child = None;
    let mut private_config = None;
    let mut port_map = Vec::new();
    if !sb_profiles.is_empty() {
        let bin_path = resolve_binary(app, "singbox/sing-box.exe")?;
        let config = TestConfig(std::env::temp_dir().join(format!("sb-batch-{}.json",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos())));
        let base = find_available_port_range(11000, sb_profiles.len() as u16)?;
        port_map = build_singbox_batch_test_config(&sb_profiles, &config.0, base).await?;
        let first_port = port_map.first().map(|(_,port)| *port).ok_or("No valid test profiles")?;
        let mut cmd = tokio::process::Command::new(bin_path);
        cmd.args(["run","-c"]).arg(&config.0).kill_on_drop(true)
            .stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);
        let mut runner = cmd.spawn().map_err(|e| format!("Failed to start test runner: {e}"))?;
        let ready = tokio::time::timeout(std::time::Duration::from_secs(3), async {
            loop {
                if pings.generation.load(Ordering::SeqCst) != generation { return Err("Ping test cancelled".to_owned()); }
                if runner.try_wait().map_err(|e| e.to_string())?.is_some() { return Err("Test runner exited before listening".to_owned()); }
                if tokio::net::TcpStream::connect(("127.0.0.1",first_port)).await.is_ok() { return Ok(()); }
                tokio::time::sleep(std::time::Duration::from_millis(50)).await;
            }
        }).await;
        if !matches!(ready, Ok(Ok(()))) {
            let _ = runner.kill().await;
            return Err("Test runner unavailable or cancelled".into());
        }
        child = Some(runner);
        private_config = Some(config);
    }
    let urls = crate::latency::targets(test_url.as_deref());
    let sem = Arc::new(tokio::sync::Semaphore::new(4));
    let mut tasks = tokio::task::JoinSet::new();
    for profile in profiles {
        let id = profile["id"].as_str().unwrap_or("").to_owned();
        let port = port_map.iter().find(|(key,_)| key == &id).map(|(_,port)| *port);
        let urls = urls.clone();
        let sem = sem.clone();
        tasks.spawn(async move {
            let _permit = sem.acquire_owned().await;
            let (ms,mode) = if let Some(port) = port {
                let ms = match crate::latency::proxy_client(port) {
                    Ok(client) => crate::latency::measure(&client,&urls).await.unwrap_or(-1),
                    Err(_) => -1,
                };
                (ms,"real")
            } else if profile["protocol"].as_str() == Some("openconnect") {
                (run_tcp_ping(profile["serverAddress"].as_str().unwrap_or("").to_owned(),profile["port"].as_u64().unwrap_or(443) as u16).await.unwrap_or(-1),"tcp")
            } else { (-1,"real") };
            (id,ms,mode)
        });
    }
    loop {
        tokio::select! {
            _ = cancelled(pings,generation) => { tasks.abort_all(); break; }
            result = tasks.join_next() => match result {
                Some(Ok((id,ms,mode))) => {
                    let _ = app.emit("vpn:pingResult",json!({"profileId":id,"latency":ms,"mode":mode,"requestId":request_id}));
                    results.insert(id,ms);
                }
                Some(Err(_)) => {},
                None => break,
            }
        }
    }
    // Reap probes before shutting down the owned runner, even on cancellation.
    while tasks.join_next().await.is_some() {}
    if let Some(mut runner) = child { let _ = runner.kill().await; }
    drop(private_config);
    Ok(results)
}

#[tauri::command]
pub async fn singbox_test_profile_real_delay(app: AppHandle, pings: State<'_, PingTestState>, profile: Value, test_url: Option<String>, request_id: Option<String>) -> Result<Value, String> {
    let id = profile["id"].as_str().unwrap_or("").to_owned();
    let results = batch_real_delay(&app,&pings,vec![profile],test_url,request_id).await?;
    let latency = results.get(&id).copied().unwrap_or(-1);
    Ok(json!({"success":latency>0,"latency":latency}))
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



#[tauri::command]
pub async fn fetch_original_ip() -> Result<String, String> {
    let res = tokio::task::spawn_blocking(|| {
        let endpoints = [
            "https://api.ipify.org",
            "https://ifconfig.me/ip",
            "https://icanhazip.com/",
            "http://ip-api.com/json/?fields=query"
        ];
        for ep in endpoints {
            if let Ok(r) = ureq::get(ep).timeout(std::time::Duration::from_millis(3000)).call() {
                if let Ok(mut text) = r.into_string() {
                    if ep.contains("ip-api.com") {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                            if let Some(ip) = val.get("query").and_then(|v| v.as_str()) {
                                return Some(ip.to_string());
                            }
                        }
                    } else {
                        text = text.trim().to_string();
                        if text.contains('.') || text.contains(':') { return Some(text); }
                    }
                }
            }
        }
        None
    }).await.map_err(|e| e.to_string())?;
    res.ok_or_else(|| "Failed to fetch IP".to_string())
}
