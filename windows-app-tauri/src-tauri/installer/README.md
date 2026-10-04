# SecureVPN installer and update handoff

The custom NSIS template is based on Tauri CLI **2.11.4**, `tauri-cli-v2.11.4`:
https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.4/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi

When updating the Tauri CLI, compare its upstream template with this file before replacing or editing it. Preserve the existing bundle identifier `com.securevpn.windows`, previous-install path restoration, uninstall registration, WebView2 handling, and shortcut handling.

Maintenance defaults to **Update (keep all settings)** for an older installation and **Reinstall (keep all settings)** for the same version. Both overwrite program files without running the old NSIS uninstaller. **Clean Install** is an explicit second choice, with Persian and English deletion text. Only that choice removes this app's roaming/local data after the old process is stopped. This includes profiles, subscriptions, preferences, WebView storage and cache for the installing user; it does not remove another Windows user's data. Silent/passive updates never select Clean Install. Downgrades are disabled. Existing WiX migration behavior is retained.

In-app update publication requirements:

- Public repository: `morezaGeek/SecureVPN`; stable, published release tag `v<semver>`.
- Exact Windows x64 asset name: `SecureVPN-v<semver>-Setup.exe`.
- Upload the installer as a GitHub release asset, whose API metadata includes a valid `sha256:` digest. Drafts, prereleases, Android assets, equal/older versions and assets outside this repository are ignored. Missing digests block automatic installation.
- Backend checks up to the 100 most recent releases through the public API without a PAT. Startup check, six-hour interval and throttled window-focus checks are complemented by the Settings manual button.
- Click downloads with verified HTTPS, size bound and SHA256 verification. It then disconnects VPN, starts the interactive installer with `/UPDATE`, and exits the app. Default maintenance preserves data. A failure before verification leaves the VPN running; installer-launch failure is shown for retry. The user can cancel the installer and reopen the existing version.
- Downloads use `%TEMP%\SecureVPN-updates`, **outside** app data, so choosing Clean Install cannot delete a running installer. The OS's normal temporary-file cleanup applies; the updater does not delete user-selected downloads.
- No publication token is included in source, UI, release metadata requests or installation files. Local publication instructions are in `GITHUB_PUBLISH.md` at the workspace root.

Validation commands (from `windows-app-tauri`):

```powershell
node node_modules/typescript/bin/tsc --noEmit
& ./scripts/test-installer-maintenance.ps1
# From src-tauri:
cargo test --lib
cargo test --lib live_github_windows_download -- --ignored --nocapture
```

The NSIS test extracts actual maintenance/cleanup code and compiles isolated user-level fixtures. All fixture deletion paths are rewritten to disposable workspace `scratch` directories. It does not install/uninstall SecureVPN or modify its registry/data. The live Rust integration test downloads and verifies a public installer but never executes it. Successful checks do not claim a full production installation has been exercised.
