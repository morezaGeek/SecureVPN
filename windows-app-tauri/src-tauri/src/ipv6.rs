use std::ptr::{null, null_mut};

use serde_json::Value;
use windows_sys::core::{w, GUID};
use windows_sys::Win32::Foundation::HANDLE;
use windows_sys::Win32::NetworkManagement::WindowsFilteringPlatform::*;
use windows_sys::Win32::System::Rpc::RPC_C_AUTHN_WINNT;

pub fn prefer_ipv6(profile: &Value) -> bool {
    profile.get("preferIpv6").and_then(Value::as_bool).unwrap_or(false)
}

pub struct Ipv6Block(HANDLE);

// The WFP RPC handle is exclusively owned and may be closed from another thread.
unsafe impl Send for Ipv6Block {}

impl Ipv6Block {
    pub fn install() -> Result<Self, String> {
        let session = FWPM_SESSION0 {
            flags: FWPM_SESSION_FLAG_DYNAMIC,
            ..Default::default()
        };
        let mut handle = null_mut();
        // WFP copies the session and filter structures during these calls.
        let status = unsafe {
            FwpmEngineOpen0(null(), RPC_C_AUTHN_WINNT, null(), &session, &mut handle)
        };
        check(status)?;

        let block = Self(handle);
        // Reject new connections promptly and stop packets from existing connections.
        block.add_filter(FWPM_LAYER_ALE_AUTH_CONNECT_V6)?;
        block.add_filter(FWPM_LAYER_OUTBOUND_IPPACKET_V6)?;
        Ok(block)
    }

    fn add_filter(&self, layer: GUID) -> Result<(), String> {
        let mut non_loopback = FWPM_FILTER_CONDITION0 {
            fieldKey: FWPM_CONDITION_FLAGS,
            matchType: FWP_MATCH_FLAGS_NONE_SET,
            conditionValue: FWP_CONDITION_VALUE0 {
                r#type: FWP_UINT32,
                Anonymous: FWP_CONDITION_VALUE0_0 { uint32: FWP_CONDITION_FLAG_IS_LOOPBACK },
            },
        };
        let mut filter = FWPM_FILTER0 {
            layerKey: layer,
            subLayerKey: FWPM_SUBLAYER_UNIVERSAL,
            flags: FWPM_FILTER_FLAG_CLEAR_ACTION_RIGHT,
            numFilterConditions: 1,
            filterCondition: &mut non_loopback,
            ..Default::default()
        };
        filter.displayData.name = w!("SecureVPN IPv6 block").cast_mut();
        filter.action.r#type = FWP_ACTION_BLOCK;
        check(unsafe { FwpmFilterAdd0(self.0, &filter, null_mut(), null_mut()) })
    }
}

impl Drop for Ipv6Block {
    fn drop(&mut self) {
        let status = unsafe { FwpmEngineClose0(self.0) };
        if status != 0 {
            log::warn!("Could not close SecureVPN IPv6 filter session (WFP 0x{status:08x})");
        }
    }
}

fn check(status: u32) -> Result<(), String> {
    if status == 0 {
        Ok(())
    } else {
        Err(format!("Could not block IPv6 (Windows Filtering Platform 0x{status:08x})"))
    }
}
