# Wintun Proxy DLL

This DLL wraps the real `wintun.dll` to make the VPN adapter persistent.

## What it does

- Intercepts `WintunCloseAdapter()` and does **nothing** (adapter stays open)
- Intercepts `WintunDeleteDriver()` and does **nothing** (driver stays loaded)
- All other functions are passed through to the real `wintun_real.dll`

## How to build

### Option 1: Visual Studio Developer Command Prompt

```cmd
cd resources\wintun-proxy
"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
build.bat
```

### Option 2: MinGW

```cmd
cd resources\wintun-proxy
build.bat
```

## Installation

1. Go to `C:\Program Files\SecureVPN\resources\openconnect\`
2. Rename `wintun.dll` to `wintun_real.dll`
3. Copy the new `wintun.dll` (from build) to the folder

## Result

- First connection: Adapter is created (~5 seconds)
- Disconnect: Adapter stays! (not deleted)
- Next connection: Adapter found instantly!

## Uninstall

To restore original behavior:
1. Delete proxy `wintun.dll`
2. Rename `wintun_real.dll` back to `wintun.dll`
