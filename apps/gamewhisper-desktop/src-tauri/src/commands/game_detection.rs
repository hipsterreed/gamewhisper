use std::collections::HashMap;
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;

use serde::Deserialize;
use tauri::Manager;

#[derive(Deserialize)]
struct GameEntry {
    name: String,
    #[allow(dead_code)]
    id: String,
}

/// Load game titles map from the bundled resource file.
/// Returns a HashMap keyed by exe name or window title → game display name.
fn load_game_titles(app: &tauri::AppHandle) -> HashMap<String, String> {
    let resource_path = app
        .path()
        .resource_dir()
        .ok()
        .map(|d| d.join("game_titles.json"));

    let json = resource_path
        .as_ref()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .unwrap_or_else(|| include_str!("../../game_titles.json").to_string());

    let raw: HashMap<String, GameEntry> = serde_json::from_str(&json).unwrap_or_default();
    raw.into_iter().map(|(k, v)| (k, v.name)).collect()
}

/// Detect the currently active game by scanning all running processes.
/// Returns the display name of the matched game, or None if not found.
pub fn detect_active_game(app: &tauri::AppHandle) -> Option<String> {
    let titles = load_game_titles(app);
    detect_active_game_with_map(&titles)
}

#[cfg(windows)]
fn detect_active_game_with_map(titles: &HashMap<String, String>) -> Option<String> {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::ProcessStatus::{EnumProcesses, GetModuleBaseNameW};
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
    };
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

    // --- Pass 1: scan all process exe names ---
    let mut pids = vec![0u32; 1024];
    let mut bytes_returned = 0u32;
    unsafe {
        if EnumProcesses(
            pids.as_mut_ptr(),
            (pids.len() * std::mem::size_of::<u32>()) as u32,
            &mut bytes_returned,
        )
        .is_err()
        {
            return None;
        }
    }

    let count = bytes_returned as usize / std::mem::size_of::<u32>();
    pids.truncate(count);

    for pid in &pids {
        if *pid == 0 {
            continue;
        }
        let handle = unsafe {
            OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                false,
                *pid,
            )
        };
        let handle = match handle {
            Ok(h) if !h.is_invalid() => h,
            _ => continue, // ACCESS_DENIED or invalid — skip silently
        };

        let mut name_buf = vec![0u16; 260];
        let len = unsafe {
            GetModuleBaseNameW(
                handle,
                None,
                &mut name_buf,
            )
        };
        unsafe { let _ = CloseHandle(handle); }

        if len == 0 {
            continue;
        }
        name_buf.truncate(len as usize);
        let exe_name = OsString::from_wide(&name_buf)
            .to_string_lossy()
            .into_owned();

        if let Some(game) = titles.get(&exe_name) {
            return Some(game.clone());
        }
    }

    // --- Pass 2: check foreground window title ---
    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.0.is_null() {
        return None;
    }

    let mut title_buf = vec![0u16; 512];
    let len = unsafe { GetWindowTextW(hwnd, &mut title_buf) };
    if len == 0 {
        return None;
    }
    title_buf.truncate(len as usize);
    let window_title = OsString::from_wide(&title_buf)
        .to_string_lossy()
        .into_owned();

    // Exact match on title
    if let Some(game) = titles.get(&window_title) {
        return Some(game.clone());
    }

    // Substring match: check if any key is contained in the window title
    for (key, game) in titles {
        if window_title.contains(key.as_str()) {
            return Some(game.clone());
        }
    }

    None
}

#[cfg(not(windows))]
fn detect_active_game_with_map(_titles: &HashMap<String, String>) -> Option<String> {
    None
}

#[tauri::command]
pub fn detect_active_game_cmd(app: tauri::AppHandle) -> Option<String> {
    detect_active_game(&app)
}
