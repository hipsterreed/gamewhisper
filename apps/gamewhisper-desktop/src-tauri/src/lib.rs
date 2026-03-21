mod commands;

use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub struct AppState {
    pub overlay_visible: Mutex<bool>,
    pub current_game: Mutex<Option<String>>,
    pub hotkey: Mutex<String>,
    pub overlay_position: Mutex<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            overlay_visible: Mutex::new(false),
            current_game: Mutex::new(None),
            hotkey: Mutex::new("Alt+G".to_string()),
            overlay_position: Mutex::new("center".to_string()),
        })
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
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
                .build(app)?;

            // --- Global hotkey: Alt+G ---
            let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::KeyG);
            app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
                if event.state() == ShortcutState::Released {
                    return;
                }
                handle_hotkey(app);
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::game_detection::detect_active_game_cmd,
            update_hotkey,
            set_overlay_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_hotkey(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let mut visible = state.overlay_visible.lock().unwrap();

    if *visible {
        // Dismiss overlay
        if let Some(overlay) = app.get_webview_window("overlay") {
            let _ = overlay.hide();
        }
        *visible = false;
    } else {
        // Detect game
        let game = commands::game_detection::detect_active_game(app);
        {
            let mut current = state.current_game.lock().unwrap();
            *current = game.clone();
        }

        // Show and position overlay
        if let Some(overlay) = app.get_webview_window("overlay") {
            let position = {
                let state = app.state::<AppState>();
                let x = state.overlay_position.lock().unwrap().clone(); x
            };
            if let Ok(Some(monitor)) = overlay.primary_monitor() {
                let win_size = overlay.outer_size().unwrap_or(tauri::PhysicalSize { width: 480, height: 200 });
                let pos = compute_overlay_position(&monitor, win_size, &position);
                let _ = overlay.set_position(pos);
            }

            let _ = overlay.show();

            // Emit game-detected event to overlay
            let payload = game.unwrap_or_else(|| "".to_string());
            let _ = overlay.emit("game-detected", payload);
        }
        *visible = true;
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
        "top-left" => tauri::PhysicalPosition { x: mx + PAD, y: my + PAD },
        "top-right" => tauri::PhysicalPosition { x: mx + mw - ww - PAD, y: my + PAD },
        _ => tauri::PhysicalPosition { x: mx + (mw - ww) / 2, y: my + (mh - wh) / 2 },
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

/// Called from the frontend when the user changes overlay position preference.
#[tauri::command]
fn set_overlay_position(app: tauri::AppHandle, position: String) {
    let state = app.state::<AppState>();
    *state.overlay_position.lock().unwrap() = position;
}

/// Called from the frontend when the user changes their hotkey in Settings.
#[tauri::command]
fn update_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let state = app.state::<AppState>();
    let old = {
        let h = state.hotkey.lock().unwrap();
        h.clone()
    };

    // Unregister old shortcut
    if let Ok(old_shortcut) = old.parse::<Shortcut>() {
        let _ = app.global_shortcut().unregister(old_shortcut);
    }

    // Register new shortcut
    let new_shortcut: Shortcut = hotkey.parse().map_err(|e| format!("{e}"))?;
    app.global_shortcut()
        .on_shortcut(new_shortcut, |app, _shortcut, event| {
            if event.state() == ShortcutState::Released {
                return;
            }
            handle_hotkey(app);
        })
        .map_err(|e| e.to_string())?;

    *state.hotkey.lock().unwrap() = hotkey;
    Ok(())
}
