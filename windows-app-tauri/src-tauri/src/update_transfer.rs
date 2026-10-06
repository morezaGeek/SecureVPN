//! Bounded parallel HTTP ranges; callers still verify the complete SHA256.
use std::{path::Path, sync::Arc, time::Duration};
use reqwest::{Client, StatusCode, Url, header};
use tokio::io::{AsyncSeekExt, AsyncWriteExt};

const CHUNK: u64 = 2 * 1024 * 1024;
const WORKERS: usize = 4;

#[derive(Debug,PartialEq)]
pub enum DownloadMethod { Single, Parallel }

pub async fn download(client: &Client, url: &str, size: u64, part: &Path,
    parallel: bool, progress: impl Fn(u64)) -> Result<DownloadMethod, String> {
    if parallel {
        // A one-byte probe verifies real range support, not just Accept-Ranges.
        if let Ok(response) = client.get(url).header(header::RANGE,"bytes=0-0")
            .header(header::ACCEPT_ENCODING,"identity").timeout(Duration::from_secs(15)).send().await {
            if valid_range(&response,0,0,size) {
                let target = response.url().clone();
                let etag = response.headers().get(header::ETAG).and_then(|v| v.to_str().ok())
                    .filter(|v| v.starts_with('"') && v.ends_with('"')).map(str::to_owned);
                if response.bytes().await.map(|b| b.len()==1).unwrap_or(false)
                    && parallel_download(client,&target,etag,size,part,&progress).await.is_ok() {
                    return Ok(DownloadMethod::Parallel);
                }
            }
        }
        // All range tasks are aborted/reaped before truncating the partial file.
        progress(0);
    }
    single_download(client,url,size,part,&progress).await?;
    Ok(DownloadMethod::Single)
}

fn valid_range(response: &reqwest::Response, start: u64, end: u64, size: u64) -> bool {
    response.status()==StatusCode::PARTIAL_CONTENT
        && response.headers().get(header::CONTENT_RANGE).and_then(|v|v.to_str().ok())
            == Some(format!("bytes {start}-{end}/{size}").as_str())
        && response.headers().get(header::CONTENT_ENCODING).map(|v|v=="identity").unwrap_or(true)
}

async fn single_download(client: &Client,url: &str,size: u64,part: &Path,progress: &impl Fn(u64)) -> Result<(),String> {
    let mut response = client.get(url).header(header::ACCEPT_ENCODING,"identity").send().await
        .map_err(|e|e.without_url().to_string())?.error_for_status().map_err(|e|e.without_url().to_string())?;
    if response.status()!=StatusCode::OK { return Err("Expected a complete installer response".into()); }
    let file = tokio::fs::File::create(part).await.map_err(|e|e.to_string())?;
    let mut file = tokio::io::BufWriter::with_capacity(1024*1024,file);
    let mut received = 0;
    while let Some(bytes) = response.chunk().await.map_err(|e|e.without_url().to_string())? {
        received += bytes.len() as u64;
        if received>size { return Err("Installer exceeds the expected size".into()); }
        file.write_all(&bytes).await.map_err(|e|e.to_string())?;
        progress(received);
    }
    if received!=size { return Err("Installer download is incomplete".into()); }
    file.flush().await.map_err(|e|e.to_string())?;
    file.get_ref().sync_all().await.map_err(|e|e.to_string())?;
    Ok(())
}

async fn segment(client: &Client,url: &Url,etag: Option<&str>,part: &Path,
    index: usize,start: u64,end: u64,size: u64,tx: &tokio::sync::mpsc::Sender<(usize,u64)>) -> Result<(),String> {
    let mut request = client.get(url.clone()).header(header::RANGE,format!("bytes={start}-{end}"))
        .header(header::ACCEPT_ENCODING,"identity").timeout(Duration::from_secs(90));
    if let Some(etag)=etag { request=request.header(header::IF_RANGE,etag); }
    let mut response=request.send().await.map_err(|e|e.without_url().to_string())?;
    if !valid_range(&response,start,end,size) { return Err("Server returned an invalid installer range".into()); }
    // Each range has its own handle/offset. Cloning one handle would share its
    // seek position on some platforms and corrupt concurrent writes.
    let mut file=tokio::fs::OpenOptions::new().write(true).open(part).await.map_err(|e|e.to_string())?;
    file.seek(std::io::SeekFrom::Start(start)).await.map_err(|e|e.to_string())?;
    let mut file=tokio::io::BufWriter::with_capacity(256*1024,file);
    let expected=end-start+1;
    let mut received=0;
    while let Some(bytes)=tokio::time::timeout(Duration::from_secs(20),response.chunk()).await
        .map_err(|_|"Installer range stopped responding".to_owned())?.map_err(|e|e.without_url().to_string())? {
        received+=bytes.len() as u64;
        if received>expected { return Err("Installer range is oversized".into()); }
        file.write_all(&bytes).await.map_err(|e|e.to_string())?;
        let _=tx.send((index,received)).await;
    }
    if received!=expected { return Err("Installer range is incomplete".into()); }
    file.flush().await.map_err(|e|e.to_string())?;
    Ok(())
}

async fn parallel_download(client: &Client,url: &Url,etag: Option<String>,size: u64,part: &Path,
    progress: &impl Fn(u64)) -> Result<(),String> {
    let file=tokio::fs::File::create(part).await.map_err(|e|e.to_string())?;
    file.set_len(size).await.map_err(|e|e.to_string())?;
    let count=size.div_ceil(CHUNK) as usize;
    let mut received=vec![0;count];
    let (tx,mut rx)=tokio::sync::mpsc::channel(64);
    let semaphore=Arc::new(tokio::sync::Semaphore::new(WORKERS));
    let mut tasks=tokio::task::JoinSet::new();
    for index in 0..count {
        let client=client.clone();let url=url.clone();let etag=etag.clone();let part=part.to_owned();
        let tx=tx.clone();let sem=semaphore.clone();
        let start=index as u64*CHUNK;let end=(start+CHUNK).min(size)-1;
        tasks.spawn(async move {
            let _permit=sem.acquire_owned().await.map_err(|e|e.to_string())?;
            let mut last=Err("Range not downloaded".to_owned());
            for _ in 0..2 {
                last=segment(&client,&url,etag.as_deref(),&part,index,start,end,size,&tx).await;
                if last.is_ok() { break; }
            }
            last
        });
    }
    drop(tx);
    let mut failure=None;
    while !tasks.is_empty() {
        tokio::select! {
            Some((index,bytes))=rx.recv() => {
                received[index]=received[index].max(bytes);
                progress(received.iter().sum());
            }
            result=tasks.join_next() => match result {
                Some(Ok(Ok(()))) => {},
                Some(Ok(Err(error))) => { failure=Some(error);break; },
                Some(Err(error)) => { failure=Some(error.to_string());break; },
                None=>break,
            }
        }
    }
    if let Some(error)=failure {
        tasks.abort_all();while tasks.join_next().await.is_some() {}
        return Err(error);
    }
    file.sync_all().await.map_err(|e|e.to_string())?;
    progress(size);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize,Ordering};
    use tokio::io::{AsyncReadExt,AsyncWriteExt};

    async fn exercise(fault: &'static str) {
        let data=Arc::new((0..9*1024*1024+123).map(|i|(i%251) as u8).collect::<Vec<_>>());
        let listener=tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url=format!("http://{}/setup.exe",listener.local_addr().unwrap());
        let active=Arc::new(AtomicUsize::new(0));let peak=Arc::new(AtomicUsize::new(0));
        let complete=Arc::new(AtomicUsize::new(0));let retry=Arc::new(AtomicUsize::new(0));
        let shared=(data.clone(),active,peak.clone(),complete.clone(),retry.clone());
        let server=tokio::spawn(async move {
            let mut children=tokio::task::JoinSet::new();
            loop {
                let (mut socket,_)=listener.accept().await.unwrap();
                let (data,active,peak,complete,retry)=shared.clone();
                children.spawn(async move {
                    let mut request=Vec::new();let mut buffer=[0u8;4096];
                    while !request.windows(4).any(|w|w==b"\r\n\r\n") {
                        let length=socket.read(&mut buffer).await.unwrap();if length==0 { return; }
                        request.extend_from_slice(&buffer[..length]);
                    }
                    let request=String::from_utf8_lossy(&request).to_lowercase();
                    let range=request.lines().find_map(|line|line.strip_prefix("range: bytes="));
                    let range=range.map(|range| { let (a,b)=range.trim().split_once('-').unwrap();(a.parse::<usize>().unwrap(),b.parse::<usize>().unwrap()) });
                    let size=data.len();let (start,end)=range.unwrap_or((0,size-1));
                    let count=active.fetch_add(1,Ordering::SeqCst)+1;peak.fetch_max(count,Ordering::SeqCst);
                    let bad=fault=="bad-header" && range.is_some() && end>0;
                    let short=fault=="short-once" && start==0 && end>0 && range.is_some() && retry.fetch_add(1,Ordering::SeqCst)==0;
                    let headers=if range.is_some() && fault!="no-ranges" {
                        if end>0 { assert!(request.contains("if-range: \"fixture\"")); }
                        format!("HTTP/1.1 206 Partial Content\r\nContent-Length: {}\r\nContent-Range: bytes {start}-{}/{size}\r\nETag: \"fixture\"\r\nConnection: close\r\n\r\n",end-start+1,if bad {end+1}else{end})
                    } else {
                        if range.is_none() { complete.fetch_add(1,Ordering::SeqCst); }
                        format!("HTTP/1.1 200 OK\r\nContent-Length: {size}\r\nConnection: close\r\n\r\n")
                    };
                    let _=socket.write_all(headers.as_bytes()).await;
                    if !bad {
                        if end>0 { tokio::time::sleep(Duration::from_millis(30)).await; }
                        let body=if fault=="no-ranges" {&data[..]} else if short {&data[start..end]} else {&data[start..=end]};
                        let _=socket.write_all(body).await;
                    }
                    active.fetch_sub(1,Ordering::SeqCst);
                });
            }
        });
        let directory=std::env::temp_dir().join(format!("securevpn-range-{}-{}",std::process::id(),fault));
        tokio::fs::create_dir_all(&directory).await.unwrap();let file=directory.join("setup.part");
        let ticks=std::sync::Mutex::new(Vec::new());
        let client=Client::builder().no_proxy().http1_only().build().unwrap();
        download(&client,&url,data.len() as u64,&file,true,|bytes|ticks.lock().unwrap().push(bytes)).await.unwrap();
        assert_eq!(tokio::fs::read(&file).await.unwrap(),*data,"Every range including tail must be assembled correctly");
        let ticks=ticks.lock().unwrap();assert_eq!(ticks.last(),Some(&(data.len() as u64)));
        assert!(ticks.iter().all(|n|*n<=data.len() as u64));
        if fault=="none" || fault=="short-once" {
            assert!(peak.load(Ordering::SeqCst)>=2,"Range transfers must actually overlap");
            assert_eq!(complete.load(Ordering::SeqCst),0,"Range success must not silently fall back");
            assert!(ticks.windows(2).all(|w|w[0]<=w[1]),"Retries must not double-count progress");
        } else { assert_eq!(complete.load(Ordering::SeqCst),1,"Broken/unsupported ranges must use complete GET"); }
        server.abort();let _=server.await;
        tokio::fs::remove_file(file).await.unwrap();tokio::fs::remove_dir(directory).await.unwrap();
    }

    #[tokio::test] async fn parallel_ranges_overlap_and_assemble_tail() { exercise("none").await; }
    #[tokio::test] async fn unsupported_range_falls_back_to_complete_request() { exercise("no-ranges").await; }
    #[tokio::test] async fn malformed_range_aborts_workers_before_fallback() { exercise("bad-header").await; }
    #[tokio::test] async fn incomplete_range_retries_without_double_counting() { exercise("short-once").await; }
}
