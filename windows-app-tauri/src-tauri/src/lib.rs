mod commands;
pub mod iran_ips;
mod openconnect;
mod singbox;
mod state;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tokio::sync::Mutex;

use crate::commands::*;
use crate::state::VpnState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        vpn_state: Arc::new(Mutex::new(VpnState::default())),
        active_pid: Arc::new(Mutex::new(None)),
        is_running: Arc::new(AtomicBool::new(false)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .manage(app_state)
        .setup(|app| {
            // Ensure system proxy is cleared on startup
            commands::set_system_proxy(false, None);

            // Build Tray Menu
            let show_item = MenuItem::with_id(app, "show", "Show Secure VPN", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        commands::set_system_proxy(false, None);
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            println!("Secure VPN Tauri Engine started successfully!");
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                commands::set_system_proxy(false, None);
            }
        })
        .invoke_handler(tauri::generate_handler![
            app_minimize,
            app_maximize,
            app_close,
            vpn_get_state,
            vpn_connect,
            vpn_disconnect,
            vpn_is_elevated,
            singbox_test_latency,
            singbox_test_server_ping,
            tcp_ping,
            singbox_test_profile_real_delay,
            subscription_fetch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
