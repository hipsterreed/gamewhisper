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

/// Detect the currently running game.
/// Tries Steam registry first (covers any Steam game automatically),
/// then falls back to process scan against game_titles.json.
pub fn detect_active_game(app: &tauri::AppHandle) -> Option<String> {
    if let Some(game) = detect_steam_game() {
        return Some(game);
    }
    let titles = load_game_titles(app);
    detect_active_game_with_map(&titles)
}

/// Check Steam's registry for a currently running game and read its name
/// from the appmanifest ACF file — works for any Steam game, no list needed.
#[cfg(windows)]
fn detect_steam_game() -> Option<String> {
    use winreg::enums::{HKEY_CURRENT_USER, KEY_READ};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Find the appid with Running=1
    let steam_apps = hkcu
        .open_subkey_with_flags("Software\\Valve\\Steam\\Apps", KEY_READ)
        .ok()?;

    let appid = steam_apps
        .enum_keys()
        .flatten()
        .find(|id| {
            steam_apps
                .open_subkey_with_flags(id, KEY_READ)
                .ok()
                .and_then(|k| k.get_value::<u32, _>("Running").ok())
                .unwrap_or(0)
                == 1
        })?;

    // Get Steam install path
    let steam_key = hkcu
        .open_subkey_with_flags("Software\\Valve\\Steam", KEY_READ)
        .ok()?;
    let steam_path: String = steam_key.get_value("SteamPath").ok()?;

    // Collect all Steam library paths (default + extras from libraryfolders.vdf)
    let default_lib = format!("{}/steamapps", steam_path);
    let mut library_paths = vec![default_lib.clone()];

    let lf_path = format!("{}/libraryfolders.vdf", default_lib);
    if let Ok(content) = std::fs::read_to_string(&lf_path) {
        for line in content.lines() {
            let parts: Vec<&str> = line.trim().split('"').collect();
            if parts.len() >= 4 && parts[1] == "path" {
                let path = parts[3].replace("\\\\", "\\");
                library_paths.push(format!("{}/steamapps", path));
            }
        }
    }

    // Find the appmanifest in any library and extract the game name
    for lib in &library_paths {
        let manifest = format!("{}/appmanifest_{}.acf", lib, appid);
        if let Ok(content) = std::fs::read_to_string(&manifest) {
            if let Some(name) = parse_acf_name(&content) {
                return Some(name);
            }
        }
    }

    None
}

#[cfg(not(windows))]
fn detect_steam_game() -> Option<String> {
    None
}

/// Parse the "name" field out of a Steam ACF manifest file.
fn parse_acf_name(content: &str) -> Option<String> {
    for line in content.lines() {
        let parts: Vec<&str> = line.trim().split('"').collect();
        if parts.len() >= 4 && parts[1] == "name" && !parts[3].is_empty() {
            return Some(parts[3].to_string());
        }
    }
    None
}

/// Fallback: scan all processes against the game_titles.json map,
/// then check the foreground window title.
#[cfg(windows)]
fn detect_active_game_with_map(titles: &HashMap<String, String>) -> Option<String> {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::ProcessStatus::{EnumProcesses, GetModuleBaseNameW};
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
    };
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

    // Pass 1: scan all process exe names
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
            OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, *pid)
        };
        let handle = match handle {
            Ok(h) if !h.is_invalid() => h,
            _ => continue,
        };

        let mut name_buf = vec![0u16; 260];
        let len = unsafe { GetModuleBaseNameW(handle, None, &mut name_buf) };
        unsafe {
            let _ = CloseHandle(handle);
        }

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

    // Pass 2: foreground window title
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

    if let Some(game) = titles.get(&window_title) {
        return Some(game.clone());
    }
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
