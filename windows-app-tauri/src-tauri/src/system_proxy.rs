//! TUN routes application traffic directly. A localhost system proxy is unnecessary
//! and inaccessible to Store apps without a loopback exemption.

const APP_PROXY: &str = "127.0.0.1:2080";

fn owns_proxy(proxy: &str) -> bool {
    proxy.trim() == APP_PROXY
}

pub fn clear_app_system_proxy() {
    #[cfg(windows)]
    unsafe {
        use std::ffi::c_void;
        use std::os::windows::process::CommandExt;

        #[repr(C)]
        union OptionValue {
            flags: u32,
            string: *mut u16,
            file_time: [u32; 2],
        }
        #[repr(C)]
        struct OptionEntry { kind: u32, value: OptionValue }
        #[repr(C)]
        struct OptionList {
            size: u32,
            connection: *mut u16,
            count: u32,
            error: u32,
            options: *mut OptionEntry,
        }
        #[link(name = "wininet")]
        extern "system" {
            fn InternetQueryOptionW(handle: *mut c_void, option: u32, buffer: *mut c_void, length: *mut u32) -> i32;
            fn InternetSetOptionW(handle: *mut c_void, option: u32, buffer: *mut c_void, length: u32) -> i32;
        }
        #[link(name = "kernel32")]
        extern "system" { fn GlobalFree(memory: *mut c_void) -> *mut c_void; }

        let mut options = [
            OptionEntry { kind: 1, value: OptionValue { flags: 0 } },
            OptionEntry { kind: 2, value: OptionValue { string: std::ptr::null_mut() } },
        ];
        let mut list = OptionList {
            size: std::mem::size_of::<OptionList>() as u32,
            connection: std::ptr::null_mut(), count: options.len() as u32,
            error: 0, options: options.as_mut_ptr(),
        };
        let mut length = list.size;
        if InternetQueryOptionW(std::ptr::null_mut(), 75, &mut list as *mut _ as *mut c_void, &mut length) == 0 {
            eprintln!("[SystemProxy] Could not query Windows proxy settings: {}", std::io::Error::last_os_error());
            return;
        }
        let flags = options[0].value.flags;
        let pointer = options[1].value.string;
        let proxy = if pointer.is_null() { String::new() } else {
            let mut count = 0;
            while *pointer.add(count) != 0 { count += 1; }
            let value = String::from_utf16_lossy(std::slice::from_raw_parts(pointer, count));
            GlobalFree(pointer as *mut c_void);
            value
        };
        // Older releases wrote ProxyEnable directly, leaving a disabled endpoint
        // and Windows' per-connection proxy cache out of sync. Read only that value.
        let legacy_owned = proxy.is_empty() && std::process::Command::new("reg")
            .args(["query", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", "ProxyServer"])
            .creation_flags(0x08000000).output().ok()
            .filter(|output| output.status.success())
            .map(|output| String::from_utf8_lossy(&output.stdout).lines().any(|line| {
                line.split_once("REG_SZ").map(|(_, value)| owns_proxy(value)).unwrap_or(false)
            })).unwrap_or(false);
        if !owns_proxy(&proxy) && !legacy_owned { return; }

        // A null per-connection server disables the proxy but can leave its old
        // registry endpoint behind. Remove only our endpoint before refreshing
        // the Windows cache; Store clients can otherwise keep using localhost.
        for name in ["ProxyServer", "ProxyOverride"] {
            let _ = std::process::Command::new("reg")
                .args(["delete", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings", "/v", name, "/f"])
                .creation_flags(0x08000000).output();
        }

        let mut options = [
            // Preserve PAC and automatic detection, remove only the manual proxy.
            OptionEntry { kind: 1, value: OptionValue { flags: (flags & !2) | 1 } },
            OptionEntry { kind: 2, value: OptionValue { string: std::ptr::null_mut() } },
            OptionEntry { kind: 3, value: OptionValue { string: std::ptr::null_mut() } },
        ];
        list.count = options.len() as u32;
        list.options = options.as_mut_ptr();
        if InternetSetOptionW(std::ptr::null_mut(), 75, &mut list as *mut _ as *mut c_void, list.size) == 0 {
            eprintln!("[SystemProxy] Could not clear the app proxy: {}", std::io::Error::last_os_error());
            return;
        }
        for option in [95, 39, 37] {
            InternetSetOptionW(std::ptr::null_mut(), option, std::ptr::null_mut(), 0);
        }
        println!("[SystemProxy] Cleared the legacy app proxy; traffic uses TUN");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cleanup_does_not_claim_other_proxy_endpoints() {
        assert!(owns_proxy("127.0.0.1:2080"));
        for proxy in ["", "127.0.0.1:7890", "proxy.example.com:2080", "127.0.0.1:20800"] {
            assert!(!owns_proxy(proxy));
        }
    }
}
