//! Public GitHub release updates. No publishing credential belongs in this app.
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use reqwest::{Client, redirect::Policy};
use semver::Version;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, State};
use tokio::io::AsyncWriteExt;
use crate::commands::{self, AppState};

const REPO: &str = "morezaGeek/SecureVPN";
const MAX_SIZE: u64 = 150 * 1024 * 1024;

#[derive(Default)]
pub struct UpdateState {
    busy: AtomicBool,
    pub installing: AtomicBool,
}

struct BusyGuard<'a>(&'a AtomicBool);
impl Drop for BusyGuard<'_> {
    fn drop(&mut self) { self.0.store(false, Ordering::SeqCst); }
}

#[derive(Serialize, Clone)]
pub struct UpdateInfo { pub version: String }

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    #[serde(default)] draft: bool,
    #[serde(default)] prerelease: bool,
    assets: Vec<Asset>,
}

#[derive(Deserialize, Clone)]
struct Asset {
    name: String,
    browser_download_url: String,
    size: u64,
    digest: Option<String>,
    state: String,
}

fn client() -> Result<Client, String> {
    Client::builder()
        .user_agent(concat!("SecureVPN/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(900))
        .redirect(Policy::custom(|attempt| {
            let url = attempt.url();
            let allowed = matches!(url.host_str(), Some("github.com" | "api.github.com" | "release-assets.githubusercontent.com" | "objects.githubusercontent.com"));
            if attempt.previous().len() >= 5 || url.scheme() != "https" || !allowed {
                attempt.error("Unexpected update download redirect")
            } else { attempt.follow() }
        }))
        .build().map_err(|e| e.to_string())
}

fn select_update(releases: Vec<Release>, current: &Version) -> Option<(UpdateInfo, Asset)> {
    releases.into_iter().filter_map(|release| {
        if release.draft || release.prerelease { return None; }
        let version = Version::parse(release.tag_name.strip_prefix('v')?).ok()?;
        if version <= *current || !version.pre.is_empty() { return None; }
        let name = format!("SecureVPN-v{version}-Setup.exe");
        let expected_url = format!("https://github.com/{REPO}/releases/download/v{version}/{name}");
        let asset = release.assets.into_iter().find(|a|
            a.name == name && a.browser_download_url == expected_url &&
            a.state == "uploaded" && a.size > 0 && a.size <= MAX_SIZE)?;
        Some((version, asset))
    }).max_by(|a, b| a.0.cmp(&b.0))
      .map(|(version, asset)| (UpdateInfo { version: version.to_string() }, asset))
}

async fn fetch_releases(client: &Client) -> Result<Vec<Release>, String> {
    let mut response = client.get(format!("https://api.github.com/repos/{REPO}/releases?per_page=100"))
        .header("Accept", "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .timeout(Duration::from_secs(25))
        .send().await.map_err(|e| format!("Could not reach GitHub: {e}"))?
        .error_for_status().map_err(|e| format!("GitHub update check failed: {e}"))?;
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if body.len() + chunk.len() > 4 * 1024 * 1024 { return Err("GitHub response is too large".into()); }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).map_err(|e| format!("Invalid release information: {e}"))
}

async fn latest(client: &Client) -> Result<Option<(UpdateInfo, Asset)>, String> {
    let releases = fetch_releases(client).await?;
    let current = Version::parse(env!("CARGO_PKG_VERSION")).map_err(|e| e.to_string())?;
    Ok(select_update(releases, &current))
}

fn expected_hash(digest: Option<&str>) -> Result<String, String> {
    let hash = digest.and_then(|d| d.strip_prefix("sha256:"))
        .filter(|d| d.len() == 64 && d.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or("This release has no valid SHA256 digest. Download it from GitHub manually.")?;
    Ok(hash.to_ascii_lowercase())
}

fn verify_download(downloaded: u64, expected_size: u64, actual: &str, expected: &str) -> Result<(), String> {
    if downloaded != expected_size { return Err("Installer download is incomplete. Please retry.".into()); }
    if actual != expected { return Err("Installer checksum mismatch. The file will not be executed.".into()); }
    Ok(())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress { downloaded: u64, total: u64, phase: &'static str }

async fn download_installer(
    client: &Client, asset: &Asset, part: &std::path::Path,
    installer: &std::path::Path, on_progress: impl Fn(Progress),
) -> Result<(), String> {
    let expected = expected_hash(asset.digest.as_deref())?;
    let result: Result<(), String> = async {
        let mut response = client.get(&asset.browser_download_url).send().await
            .map_err(|e| format!("Download failed: {e}"))?
            .error_for_status().map_err(|e| e.to_string())?;
        let file = tokio::fs::File::create(part).await.map_err(|e| e.to_string())?;
        let mut file = tokio::io::BufWriter::with_capacity(1024 * 1024, file);
        let mut hash = Sha256::new();
        let mut downloaded = 0u64;
        let mut last_percent = 101;
        while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
            downloaded += chunk.len() as u64;
            if downloaded > asset.size || downloaded > MAX_SIZE { return Err("Installer exceeds the expected size".into()); }
            hash.update(&chunk);
            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            let percent = downloaded * 100 / asset.size;
            if percent != last_percent {
                on_progress(Progress { downloaded, total: asset.size, phase: "downloading" });
                last_percent = percent;
            }
        }
        file.flush().await.map_err(|e| e.to_string())?;
        file.get_ref().sync_all().await.map_err(|e| e.to_string())?;
        drop(file);
        verify_download(downloaded, asset.size, &format!("{:x}", hash.finalize()), &expected)?;
        // A previous verified installer may exist after a cancelled installation.
        if tokio::fs::try_exists(installer).await.map_err(|e| e.to_string())? {
            tokio::fs::remove_file(installer).await.map_err(|e| e.to_string())?;
        }
        tokio::fs::rename(part, installer).await.map_err(|e| e.to_string())?;
        Ok(())
    }.await;
    if result.is_err() { let _ = tokio::fs::remove_file(part).await; }
    result
}

#[tauri::command]
pub async fn app_check_update() -> Result<Option<UpdateInfo>, String> {
    Ok(latest(&client()?).await?.map(|(info, _)| info))
}

#[tauri::command]
pub async fn app_install_update(app: AppHandle, update: State<'_, UpdateState>, vpn: State<'_, AppState>) -> Result<(), String> {
    if update.busy.compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst).is_err() {
        return Err("An update is already in progress".into());
    }
    let _guard = BusyGuard(&update.busy);
    let client = client()?;
    let (info, asset) = latest(&client).await?.ok_or("No newer Windows release is available")?;
    expected_hash(asset.digest.as_deref())?;
    // Keep the running installer outside app data: Clean Install removes that
    // entire tree, and must not fail because its own executable is still locked.
    let dir = std::env::temp_dir().join("SecureVPN-updates");
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let part = dir.join(format!("SecureVPN-v{}-Setup.part", info.version));
    let installer = dir.join(&asset.name);
    download_installer(&client, &asset, &part, &installer, |progress| {
        let _ = app.emit("app:updateProgress", progress);
    }).await?;

    update.installing.store(true, Ordering::SeqCst);
    let _ = app.emit("app:updateProgress", Progress { downloaded: asset.size, total: asset.size, phase: "installing" });
    if let Err(error) = commands::vpn_disconnect(app.clone(), vpn).await {
        update.installing.store(false, Ordering::SeqCst);
        return Err(error);
    }
    match std::process::Command::new(&installer).arg("/UPDATE").spawn() {
        Ok(_) => { app.exit(0); Ok(()) }
        Err(error) => {
            update.installing.store(false, Ordering::SeqCst);
            Err(format!("Could not start the installer: {error}"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn release(version: &str) -> Release {
        let name = format!("SecureVPN-v{version}-Setup.exe");
        Release { tag_name: format!("v{version}"), draft: false, prerelease: false,
            assets: vec![Asset { browser_download_url: format!("https://github.com/{REPO}/releases/download/v{version}/{name}"), name, size: 30000000, digest: None, state: "uploaded".into() }] }
    }
    #[test]
    fn semantic_order_and_no_downgrade() {
        let current = Version::parse("2.0.9").unwrap();
        assert_eq!(select_update(vec![release("2.0.9"), release("2.0.10"), release("2.0.8")], &current).unwrap().0.version, "2.0.10");
        assert!(select_update(vec![release("2.0.9"), release("2.0.8")], &current).is_none());
    }
    #[test]
    fn ignore_android_drafts_and_prereleases() {
        let mut android = release("3.0.0"); android.assets[0].name = "SecureVPN.apk".into();
        let mut draft = release("4.0.0"); draft.draft = true;
        let mut preview = release("5.0.0"); preview.prerelease = true;
        assert!(select_update(vec![android, draft, preview, release("3.0.0-beta.1")], &Version::parse("2.0.34").unwrap()).is_none());
    }
    #[test]
    fn reject_external_or_oversized_assets() {
        let mut external = release("3.0.0"); external.assets[0].browser_download_url = "https://example.com/setup.exe".into();
        let mut big = release("4.0.0"); big.assets[0].size = MAX_SIZE + 1;
        assert!(select_update(vec![external, big], &Version::parse("2.0.34").unwrap()).is_none());
    }
    #[test]
    fn missing_malformed_or_mismatched_hash_never_installs() {
        assert!(expected_hash(None).is_err());
        assert!(expected_hash(Some("sha256:bad")).is_err());
        let hash = format!("{:x}", Sha256::digest(b"installer"));
        assert!(verify_download(9, 9, &hash, &hash).is_ok());
        assert!(verify_download(8, 9, &hash, &hash).is_err());
        assert!(verify_download(9, 9, &hash, &"0".repeat(64)).is_err());
    }

    #[tokio::test]
    async fn corrupt_download_is_removed_without_replacing_verified_installer() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut request = [0u8; 1024];
            let _ = socket.read(&mut request).await;
            socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 9\r\nConnection: close\r\n\r\ncorrupted").await.unwrap();
        });
        let dir = std::env::temp_dir().join(format!("securevpn-update-test-{}", std::process::id()));
        tokio::fs::create_dir_all(&dir).await.unwrap();
        let part = dir.join("setup.part");
        let installer = dir.join("setup.exe");
        tokio::fs::write(&installer, b"previous verified file").await.unwrap();
        let mut asset = release("3.0.0").assets.remove(0);
        asset.browser_download_url = format!("http://{address}/setup.exe");
        asset.size = 9;
        asset.digest = Some(format!("sha256:{}", "0".repeat(64)));
        let result = download_installer(&Client::new(), &asset, &part, &installer, |_| {}).await;
        assert!(result.unwrap_err().contains("checksum mismatch"));
        assert!(!part.exists());
        assert_eq!(tokio::fs::read(&installer).await.unwrap(), b"previous verified file");
        tokio::fs::remove_file(installer).await.unwrap();
        tokio::fs::remove_dir(dir).await.unwrap();
        server.await.unwrap();
    }

    #[tokio::test]
    async fn buffered_download_flushes_tail_and_preserves_progress_and_hash() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let bytes = vec![0x5au8; 36 * 1024 * 1024 + 123];
        let size = bytes.len() as u64;
        let digest = format!("sha256:{:x}", Sha256::digest(&bytes));
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut request = [0u8; 1024];
            socket.read(&mut request).await.unwrap();
            socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Length: {size}\r\nConnection: close\r\n\r\n").as_bytes()).await.unwrap();
            for chunk in bytes.chunks(4096) { socket.write_all(chunk).await.unwrap(); }
        });
        let dir = std::env::temp_dir().join(format!("securevpn-buffer-test-{}",std::process::id()));
        tokio::fs::create_dir_all(&dir).await.unwrap();
        let mut asset = release("3.0.0").assets.remove(0);
        asset.browser_download_url = format!("http://{address}/setup.exe");asset.size = size;asset.digest = Some(digest);
        let progress = std::sync::Mutex::new(Vec::new());
        let started = std::time::Instant::now();
        let installer = dir.join("setup.exe");
        download_installer(&Client::builder().no_proxy().build().unwrap(), &asset, &dir.join("setup.part"), &installer, |p| progress.lock().unwrap().push(p.downloaded)).await.unwrap();
        assert_eq!(tokio::fs::metadata(&installer).await.unwrap().len(),size);
        let ticks = progress.lock().unwrap();
        assert_eq!(ticks.last(),Some(&size));
        assert!(ticks.windows(2).all(|w| w[0] < w[1]));
        println!("Buffered 36 MiB installer including partial final buffer: {:.2}s",started.elapsed().as_secs_f64());
        tokio::fs::remove_file(installer).await.unwrap();tokio::fs::remove_dir(dir).await.unwrap();
        server.await.unwrap();
    }

    #[tokio::test]
    #[ignore = "Read-only GitHub integration: downloads a public Windows installer, verifies it, never executes or installs it"]
    async fn live_github_windows_download() {
        let client = client().unwrap();
        let releases = fetch_releases(&client).await.unwrap();
        let (info, asset) = select_update(releases, &Version::parse("0.0.0").unwrap()).expect("Public Windows release");
        let dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../scratch/windows-diagnostics/updater-live-test");
        tokio::fs::create_dir_all(&dir).await.unwrap();
        let part = dir.join("setup.part");
        let installer = dir.join("verified-setup.exe");
        let started = std::time::Instant::now();
        let samples = std::sync::Mutex::new(vec![(0u64,0f64)]);
        download_installer(&client, &asset, &part, &installer, |p| {
            let mut samples = samples.lock().unwrap();
            if p.downloaded >= samples.last().unwrap().0 + asset.size / 10 || p.downloaded == asset.size {
                let (previous,at) = *samples.last().unwrap();
                let elapsed = started.elapsed().as_secs_f64();
                println!("Download {}%: {:.2} Mbps interval; {:.1}s elapsed",p.downloaded*100/p.total,(p.downloaded-previous) as f64*8.0/(elapsed-at)/1_000_000.0,elapsed);
                samples.push((p.downloaded,elapsed));
            }
        }).await.unwrap();
        assert_eq!(tokio::fs::metadata(&installer).await.unwrap().len(), asset.size);
        println!("Verified public Windows v{}: {} bytes; {}", info.version, asset.size, asset.digest.unwrap());
        assert!(app_check_update().await.unwrap().is_none(), "Current local version should not downgrade to the published release");
        tokio::fs::remove_file(installer).await.unwrap();
        tokio::fs::remove_dir(dir).await.unwrap();
    }
}
