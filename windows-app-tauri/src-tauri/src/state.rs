use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnStats {
    #[serde(rename = "uploadSpeed")]
    pub upload_speed: u64,
    #[serde(rename = "downloadSpeed")]
    pub download_speed: u64,
    #[serde(rename = "totalUploaded")]
    pub total_uploaded: u64,
    #[serde(rename = "totalDownloaded")]
    pub total_downloaded: u64,
    #[serde(rename = "connectedTime")]
    pub connected_time: u64,
    #[serde(rename = "privateIp")]
    pub private_ip: String,
    #[serde(rename = "publicIp")]
    pub public_ip: String,
    #[serde(rename = "countryCode", skip_serializing_if = "Option::is_none")]
    pub country_code: Option<String>,
    #[serde(rename = "countryName", skip_serializing_if = "Option::is_none")]
    pub country_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mtu: Option<u32>,
    #[serde(rename = "transportProtocol", skip_serializing_if = "Option::is_none")]
    pub transport_protocol: Option<String>,
}

impl Default for VpnStats {
    fn default() -> Self {
        Self {
            upload_speed: 0,
            download_speed: 0,
            total_uploaded: 0,
            total_downloaded: 0,
            connected_time: 0,
            private_ip: String::new(),
            public_ip: String::new(),
            country_code: None,
            country_name: None,
            mtu: None,
            transport_protocol: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnState {
    pub status: String,
    pub profile: Option<serde_json::Value>,
    pub stats: VpnStats,
}

impl Default for VpnState {
    fn default() -> Self {
        Self {
            status: "disconnected".into(),
            profile: None,
            stats: VpnStats::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnLog {
    pub level: String,
    pub message: String,
    pub timestamp: u64,
}
