use std::time::{Duration, Instant};
use reqwest::{Client, Proxy, redirect::Policy};

pub fn proxy_client(port: u16) -> Result<Client, String> {
    Client::builder().proxy(Proxy::all(format!("http://127.0.0.1:{port}")).map_err(|e| e.to_string())?)
        .http1_only().tcp_nodelay(true).redirect(Policy::none())
        .connect_timeout(Duration::from_secs(3)).timeout(Duration::from_secs(3))
        .pool_max_idle_per_host(1).pool_idle_timeout(Duration::from_secs(30))
        .build().map_err(|e| e.to_string())
}

pub fn targets(custom: Option<&str>) -> Vec<String> {
    match custom.filter(|url| !url.trim().is_empty()) {
        Some(url) => {
            let url = url.trim();
            vec![if url.starts_with("https://") { url.to_owned() }
                else { format!("https://{}", url.strip_prefix("http://").unwrap_or(url)) }]
        },
        None => ["https://www.gstatic.com/generate_204", "https://cp.cloudflare.com/generate_204",
            "https://www.google.com/generate_204"].iter().map(|url| url.to_string()).collect(),
    }
}

async fn request(client: &Client, url: &str) -> Result<i64, String> {
    let started = Instant::now();
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() { return Err(format!("Probe HTTP {}", response.status())); }
    // These are small connectivity probes; consume them so the TLS connection is
    // reusable, but don't accidentally measure a redirect or a large download.
    let mut response = response;
    let mut size = 0;
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        size += chunk.len();
        if size > 4096 { return Err("Probe response exceeded 4 KiB".into()); }
    }
    Ok(started.elapsed().as_millis().max(1) as i64)
}

pub async fn measure(client: &Client, urls: &[String]) -> Result<i64, String> {
    tokio::time::timeout(Duration::from_secs(9), async {
        let mut error = "No reachable probe endpoint".to_owned();
        for url in urls {
            match request(client, url).await {
                Ok(cold) => return Ok(request(client, url).await.unwrap_or(cold)),
                Err(e) => error = e,
            }
        }
        Err(error)
    }).await.map_err(|_| "Probe timed out after 9 seconds".to_owned())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    #[tokio::test]
    async fn unreachable_target_falls_back_and_warm_request_reuses_connection() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            for _ in 0..2 {
                let mut data = [0u8; 2048];
                assert!(socket.read(&mut data).await.unwrap() > 0);
                socket.write_all(b"HTTP/1.1 204 No Content\r\nConnection: keep-alive\r\n\r\n").await.unwrap();
            }
        });
        let client = Client::builder().no_proxy().http1_only().timeout(Duration::from_millis(200)).build().unwrap();
        let urls = vec!["http://127.0.0.1:1/unreachable".into(), format!("http://{address}/generate_204")];
        assert!(measure(&client, &urls).await.unwrap() > 0);
        server.await.unwrap();
    }

    #[tokio::test]
    #[ignore = "Private fixture connectivity diagnostics; isolated proxy only, never establishes a system VPN"]
    async fn live_profile_latency() {
        let profiles: Vec<serde_json::Value> = serde_json::from_str(&std::fs::read_to_string(std::env::var("SECUREVPN_DIAGNOSTICS_FIXTURE").unwrap()).unwrap()).unwrap();
        assert!(profiles.iter().all(|p| p["name"] != "Direct-To-Server"));
        let directory = std::path::PathBuf::from(std::env::var("SECUREVPN_DIAGNOSTICS_OUTPUT").unwrap());
        std::fs::create_dir_all(&directory).unwrap();
        let config = directory.join("latency-batch.private.json");
        let map = crate::singbox::build_singbox_batch_test_config(&profiles,&config,24100).await.unwrap();
        let mut command = tokio::process::Command::new(std::env::var("SECUREVPN_TEST_CORE").unwrap());
        command.args(["run","-c"]).arg(&config).kill_on_drop(true).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
        #[cfg(windows)]
        command.creation_flags(0x08000000);
        let mut child = command.spawn().unwrap();
        tokio::time::sleep(Duration::from_millis(600)).await;
        assert!(child.try_wait().unwrap().is_none(),"Core rejected diagnostic config");
        let started = Instant::now();
        let mut output = Vec::new();
        for batch in map.chunks(4) {
            let mut tasks = tokio::task::JoinSet::new();
            for (id,port) in batch {
                let id = id.clone();let port = *port;
                tasks.spawn(async move {
                    let client = proxy_client(port).unwrap();
                    let started = Instant::now();
                    let first = measure(&client,&targets(None)).await.unwrap_or(-1);
                    let second = if first > 0 { measure(&client,&targets(None)).await.unwrap_or(-1) } else { -1 };
                    (id,first,second,started.elapsed().as_millis())
                });
            }
            while let Some(result) = tasks.join_next().await {
                let (id,first,second,elapsed) = result.unwrap();
                let profile = profiles.iter().find(|p| p["id"].as_str() == Some(&id)).unwrap();
                let record = serde_json::json!({"name":profile["name"],"first":first,"repeat":second,"elapsedMs":elapsed});
                println!("{}",record);
                output.push(record);
            }
        }
        child.kill().await.unwrap();
        std::fs::remove_file(config).unwrap();
        std::fs::write(directory.join("latency-results.private.json"),serde_json::to_vec_pretty(&output).unwrap()).unwrap();
        println!("Profiles tested: {}; reachable: {}; wall time: {:.2}s",output.len(),output.iter().filter(|p| p["first"].as_i64().unwrap()>0).count(),started.elapsed().as_secs_f64());
    }
}
