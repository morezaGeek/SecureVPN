mod commands;
pub mod iran_ips;
mod openconnect;
mod singbox;
mod state;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
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

            // Build Initial Tray Menu
            let start_item = MenuItem::with_id(app, "start_vpn", "Start VPN", true, None::<&str>)?;
            let stop_item = MenuItem::with_id(app, "stop_vpn", "Stop VPN", false, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let empty_profile = MenuItem::with_id(app, "no_profiles", "No profiles configured", false, None::<&str>)?;
            let empty_profile_refs: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![&empty_profile];
            let connect_submenu = Submenu::with_items(app, "Connect", true, &empty_profile_refs)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let show_item = MenuItem::with_id(app, "show", "Show Secure VPN", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &start_item,
                    &stop_item,
                    &sep1,
                    &connect_submenu,
                    &sep2,
                    &show_item,
                    &quit_item,
                ],
            )?;

            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray-light.png"))
                .or_else(|_| tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")))
                .ok();

            let mut tray_builder = TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .show_menu_on_left_click(false);

            if let Some(ic) = tray_icon {
                tray_builder = tray_builder.icon(ic);
            } else if let Some(def_ic) = app.default_window_icon() {
                tray_builder = tray_builder.icon(def_ic.clone());
            }

            let _tray = tray_builder
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        commands::set_system_proxy(false, None);
                        app.exit(0);
                    }
                    "start_vpn" => {
                        let _ = app.emit("tray:connect", ());
                    }
                    "stop_vpn" => {
                        let _ = app.emit("tray:disconnect", ());
                    }
                    id if id.starts_with("profile:") => {
                        let profile_id = id.trim_start_matches("profile:").to_string();
                        let _ = app.emit("tray:selectProfile", profile_id);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } | TrayIconEvent::DoubleClick {
                            button: MouseButton::Left,
                            ..
                        } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
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
            http_ping,
            singbox_test_profile_real_delay,
            singbox_batch_real_delay,
            subscription_fetch,
            tray_update_menu,
            open_external_url,
            fetch_original_ip,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
