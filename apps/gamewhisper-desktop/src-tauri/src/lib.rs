mod commands;

use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

pub struct AppState {
    pub overlay_visible: Mutex<bool>,
    pub current_game: Mutex<Option<String>>,
    pub hotkey: Mutex<String>,
    pub overlay_position: Mutex<String>,
    pub monitor_index: Mutex<usize>,
}

#[derive(serde::Serialize)]
pub struct MonitorInfo {
    pub index: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

/// Convert a frontend hotkey string like "Alt+G" or "Control+Shift+F1"
/// into a Shortcut. Single letters become KeyX codes; digits become DigitX.
fn parse_hotkey_str(s: &str) -> Option<Shortcut> {
    let parts: Vec<&str> = s.split('+').collect();
    let key = parts.last()?;
    let modifier_strs = &parts[..parts.len() - 1];

    let mut modifiers = Modifiers::empty();
    for m in modifier_strs {
        match m.to_ascii_lowercase().as_str() {
            "alt" => modifiers |= Modifiers::ALT,
            "control" | "ctrl" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "meta" | "super" => modifiers |= Modifiers::META,
            _ => return None,
        }
    }

    let code_str = if key.len() == 1 && key.chars().next()?.is_ascii_alphabetic() {
        format!("Key{}", key.to_ascii_uppercase())
    } else if key.len() == 1 && key.chars().next()?.is_ascii_digit() {
        format!("Digit{}", key)
    } else {
        key.to_string()
    };

    let code: Code = code_str.parse().ok()?;
    let mods = if modifiers.is_empty() { None } else { Some(modifiers) };
    Some(Shortcut::new(mods, code))
}

fn register_hotkey(app: &tauri::AppHandle, hotkey: &str) -> Result<(), String> {
    let shortcut = parse_hotkey_str(hotkey)
        .ok_or_else(|| format!("Invalid hotkey: {hotkey}"))?;
    app.global_shortcut()
        .on_shortcut(shortcut, |app, _shortcut, event| {
            if event.state() == ShortcutState::Released {
                return;
            }
            handle_hotkey(app);
        })
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            overlay_visible: Mutex::new(false),
            current_game: Mutex::new(None),
            hotkey: Mutex::new("Alt+G".to_string()),
            overlay_position: Mutex::new("center".to_string()),
            monitor_index: Mutex::new(0),
        })
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Register deep-link scheme in dev (installer handles it in production)
            #[cfg(debug_assertions)]
            app.deep_link().register("gamewhisper")?;

            // --- Load saved settings ---
            let store = app.store("settings.json").ok();
            let saved_hotkey = store
                .as_ref()
                .and_then(|s| s.get("hotkey"))
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .unwrap_or_else(|| "Alt+G".to_string());
            let saved_position = store
                .as_ref()
                .and_then(|s| s.get("overlayPosition"))
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .unwrap_or_else(|| "center".to_string());
            let saved_monitor_index = store
                .as_ref()
                .and_then(|s| s.get("monitorIndex"))
                .and_then(|v| v.as_u64().map(|n| n as usize))
                .unwrap_or(0);

            {
                let state = app.state::<AppState>();
                *state.hotkey.lock().unwrap() = saved_hotkey.clone();
                *state.overlay_position.lock().unwrap() = saved_position;
                *state.monitor_index.lock().unwrap() = saved_monitor_index;
            }

            // --- System tray ---
            let show_item = MenuItem::with_id(app, "show-overlay", "Show Overlay", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let admin_item = MenuItem::with_id(app, "run-as-admin", "Run as Administrator", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[&show_item, &settings_item, &sep, &admin_item, &quit_item],
            )?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show-overlay" => toggle_overlay(app),
                    "settings" => open_settings(app),
                    "run-as-admin" => restart_as_admin(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                        open_settings(tray.app_handle());
                    }
                })
                .build(app)?;

            // Remove DWM border on the settings and overlay windows
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_shadow(false);
            }
            if let Some(win) = app.get_webview_window("overlay") {
                let _ = win.set_shadow(false);
                // Re-assert always-on-top whenever the overlay loses focus so it
                // stays above windowed-borderless games (e.g. Stardew Valley) that
                // also claim topmost z-order when activated.
                let win_clone = win.clone();
                win.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let _ = win_clone.set_always_on_top(true);
                    }
                });
            }

            // --- Register saved hotkey ---
            if let Err(e) = register_hotkey(app.handle(), &saved_hotkey) {
                log::warn!("Failed to register saved hotkey '{saved_hotkey}': {e}, falling back to Alt+G");
                let _ = register_hotkey(app.handle(), "Alt+G");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::game_detection::detect_active_game_cmd,
            update_hotkey,
            set_overlay_position,
            get_monitors,
            set_monitor,
            start_oauth_server,
            open_settings_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_hotkey(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let mut visible = state.overlay_visible.lock().unwrap();

    if *visible {
        if let Some(overlay) = app.get_webview_window("overlay") {
            let _ = overlay.emit("overlay-hide", "");
            let _ = overlay.hide();
        }
        *visible = false;
    } else {
        let game = commands::game_detection::detect_active_game(app);
        {
            let mut current = state.current_game.lock().unwrap();
            *current = game.clone();
        }

        if let Some(overlay) = app.get_webview_window("overlay") {
            let position = {
                let x = state.overlay_position.lock().unwrap().clone(); x
            };
            let monitor_index = *state.monitor_index.lock().unwrap();
            if let Some(monitor) = get_target_monitor(&overlay, monitor_index) {
                let win_size = overlay.outer_size().unwrap_or(tauri::PhysicalSize { width: 480, height: 320 });
                let pos = compute_overlay_position(&monitor, win_size, &position);
                let _ = overlay.set_position(pos);
            }

            let _ = overlay.show();
            let _ = overlay.set_focus();
            let payload = game.unwrap_or_else(|| "".to_string());
            let _ = overlay.emit("game-detected", payload);
        }
        *visible = true;
    }
}

fn get_target_monitor(overlay: &tauri::WebviewWindow, index: usize) -> Option<tauri::Monitor> {
    let monitors = overlay.available_monitors().ok()?;
    if index < monitors.len() {
        monitors.into_iter().nth(index)
    } else {
        overlay.primary_monitor().ok().flatten()
    }
}

fn compute_overlay_position(
    monitor: &tauri::Monitor,
    win_size: tauri::PhysicalSize<u32>,
    position: &str,
) -> tauri::PhysicalPosition<i32> {
    let mw = monitor.size().width as i32;
    let mh = monitor.size().height as i32;
    let mx = monitor.position().x;
    let my = monitor.position().y;
    let ww = win_size.width as i32;
    let wh = win_size.height as i32;
    const PAD: i32 = 24;

    match position {
        "top-left"   => tauri::PhysicalPosition { x: mx + PAD,            y: my + PAD + 10 },
        "top-center" => tauri::PhysicalPosition { x: mx + (mw - ww) / 2, y: my + PAD + 10 },
        "top-right"  => tauri::PhysicalPosition { x: mx + mw - ww - PAD, y: my + PAD + 10 },
        _            => tauri::PhysicalPosition { x: mx + (mw - ww) / 2, y: my + (mh - wh) / 2 },
    }
}

fn toggle_overlay(app: &tauri::AppHandle) {
    handle_hotkey(app);
}

fn open_settings(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

#[cfg(windows)]
fn restart_as_admin(app: &tauri::AppHandle) {
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let exe = std::env::current_exe().unwrap_or_default();
    let exe_wide: Vec<u16> = exe.as_os_str().encode_wide().chain(Some(0)).collect();
    let verb: Vec<u16> = "runas\0".encode_utf16().collect();

    unsafe {
        ShellExecuteW(
            None,
            PCWSTR(verb.as_ptr()),
            PCWSTR(exe_wide.as_ptr()),
            None,
            None,
            SW_SHOWNORMAL,
        );
    }
    app.exit(0);
}

#[cfg(not(windows))]
fn restart_as_admin(_app: &tauri::AppHandle) {}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) {
    open_settings(&app);
}

#[tauri::command]
fn set_overlay_position(app: tauri::AppHandle, position: String) {
    let state = app.state::<AppState>();
    *state.overlay_position.lock().unwrap() = position.clone();

    if let Some(overlay) = app.get_webview_window("overlay") {
        let monitor_index = *state.monitor_index.lock().unwrap();
        if let Some(monitor) = get_target_monitor(&overlay, monitor_index) {
            let win_size = overlay.outer_size().unwrap_or(tauri::PhysicalSize { width: 480, height: 320 });
            let pos = compute_overlay_position(&monitor, win_size, &position);
            let _ = overlay.set_position(pos);
        }
    }
}

#[tauri::command]
fn get_monitors(app: tauri::AppHandle) -> Vec<MonitorInfo> {
    let Some(win) = app.get_webview_window("overlay") else { return vec![] };
    let primary_name = win.primary_monitor().ok().flatten().and_then(|m| m.name().map(|s| s.to_string()));
    let monitors = win.available_monitors().unwrap_or_default();
    monitors.into_iter().enumerate().map(|(i, m)| {
        let raw_name = m.name().map(|s| s.to_string());
        let is_primary = primary_name.as_ref().is_some_and(|p| raw_name.as_ref() == Some(p));
        let label = if is_primary {
            format!("Monitor {} (Primary)", i + 1)
        } else {
            format!("Monitor {}", i + 1)
        };
        MonitorInfo {
            index: i,
            name: label,
            width: m.size().width,
            height: m.size().height,
            is_primary,
        }
    }).collect()
}

#[tauri::command]
fn set_monitor(app: tauri::AppHandle, index: usize) {
    let state = app.state::<AppState>();
    *state.monitor_index.lock().unwrap() = index;
}

/// Binds a one-shot HTTP server on a random loopback port, waits for the OAuth
/// redirect, emits `oauth-callback` with the raw query string, then shuts down.
#[tauri::command]
fn start_oauth_server(window: tauri::Window) -> Result<u16, String> {
    use std::io::{Read, Write};
    use std::net::TcpListener;

    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();

    std::thread::spawn(move || {
        if let Ok((mut stream, _)) = listener.accept() {
            let mut buf = vec![0u8; 8192];
            if let Ok(n) = stream.read(&mut buf) {
                let request = String::from_utf8_lossy(&buf[..n]).to_string();
                // First line: "GET /?code=...&state=... HTTP/1.1"
                if let Some(line) = request.lines().next() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        window.emit("oauth-callback", parts[1].to_string()).ok();
                    }
                }
            }
            let body = b"<!DOCTYPE html><html><head><meta charset='utf-8'><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#08080f;color:#fff}.card{display:flex;flex-direction:column;align-items:center;gap:16px;padding:40px 48px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px}.icon{width:48px;height:48px;background:rgba(255,255,255,0.07);border-radius:50%;display:flex;align-items:center;justify-content:center}.icon svg{width:22px;height:22px}h1{font-size:18px;font-weight:600;letter-spacing:-0.01em;color:rgba(255,255,255,0.9)}p{font-size:13px;color:rgba(255,255,255,0.35);line-height:1.5}</style></head><body><div class='card'><div class='icon'><svg viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 6L9 17l-5-5'/></svg></div><h1>You&rsquo;re signed in</h1><p>You can close this tab and return to GameWhisper.</p></div><script>window.close()</script></body></html>";
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                body.len()
            );
            let _ = stream.write_all(response.as_bytes());
            let _ = stream.write_all(body);
        }
    });

    Ok(port)
}

#[tauri::command]
fn update_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    let state = app.state::<AppState>();
    let old = {
        let h = state.hotkey.lock().unwrap();
        h.clone()
    };

    // Unregister old shortcut
    if let Some(old_shortcut) = parse_hotkey_str(&old) {
        let _ = app.global_shortcut().unregister(old_shortcut);
    }

    // Register new shortcut
    register_hotkey(&app, &hotkey)?;

    *state.hotkey.lock().unwrap() = hotkey;
    Ok(())
}
