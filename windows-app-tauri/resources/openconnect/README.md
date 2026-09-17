# OpenConnect Resources

This folder should contain the OpenConnect executable and its dependencies for Windows.

## Required Files

1. **openconnect.exe** - The main OpenConnect executable
2. **Required DLLs** - GnuTLS and other dependencies

## How to Obtain OpenConnect for Windows

### Option 1: Official Builds
Download from: https://www.infradead.org/openconnect/packages.html

### Option 2: Build from Source
See: https://www.infradead.org/openconnect/building.html

### Option 3: Third-party Builds
- OpenConnect GUI for Windows includes the binaries
- Download from: https://github.com/openconnect/openconnect-gui/releases

## TAP-Windows Driver

The TAP-Windows driver is required for VPN functionality. Install it from:
- OpenVPN: https://openvpn.net/community-downloads/
- Or TAP-Windows standalone: https://build.openvpn.net/downloads/releases/

## File Structure

After setup, this folder should contain:
```
openconnect/
├── openconnect.exe
├── libgnutls-30.dll
├── libgmp-10.dll
├── libhogweed-6.dll
├── libnettle-8.dll
├── libp11-kit-0.dll
├── libgcc_s_seh-1.dll
├── libstdc++-6.dll
└── ... (other required DLLs)
```
