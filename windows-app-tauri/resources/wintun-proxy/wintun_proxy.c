/*
 * Wintun Proxy DLL - Persistent Adapter
 * 
 * This DLL wraps the real wintun.dll and intercepts certain calls:
 * - WintunCloseAdapter: Ignored (adapter stays open)
 * - WintunDeleteDriver: Ignored (driver stays loaded)
 * 
 * This allows the VPN adapter to persist across connections.
 * 
 * Build with: cl /LD wintun_proxy.c /Fe:wintun.dll
 *        or: gcc -shared -o wintun.dll wintun_proxy.c
 */

#include <windows.h>
#include <stdio.h>

// Original DLL handle
static HMODULE hRealWintun = NULL;

// Wintun types (from wintun.h)
typedef void* WINTUN_ADAPTER_HANDLE;
typedef void* WINTUN_SESSION_HANDLE;
typedef BOOL WINTUN_LOGGER_CALLBACK;

// Function pointer types for all Wintun exports
typedef WINTUN_ADAPTER_HANDLE (WINAPI *PFN_WintunCreateAdapter)(
    const WCHAR* Name, const WCHAR* TunnelType, const GUID* RequestedGUID);
typedef WINTUN_ADAPTER_HANDLE (WINAPI *PFN_WintunOpenAdapter)(const WCHAR* Name);
typedef void (WINAPI *PFN_WintunCloseAdapter)(WINTUN_ADAPTER_HANDLE Adapter);
typedef BOOL (WINAPI *PFN_WintunDeleteDriver)(void);
typedef BOOL (WINAPI *PFN_WintunGetAdapterLUID)(WINTUN_ADAPTER_HANDLE Adapter, void* Luid);
typedef DWORD (WINAPI *PFN_WintunGetRunningDriverVersion)(void);
typedef void (WINAPI *PFN_WintunSetLogger)(WINTUN_LOGGER_CALLBACK NewLogger);
typedef WINTUN_SESSION_HANDLE (WINAPI *PFN_WintunStartSession)(
    WINTUN_ADAPTER_HANDLE Adapter, DWORD Capacity);
typedef void (WINAPI *PFN_WintunEndSession)(WINTUN_SESSION_HANDLE Session);
typedef HANDLE (WINAPI *PFN_WintunGetReadWaitEvent)(WINTUN_SESSION_HANDLE Session);
typedef BYTE* (WINAPI *PFN_WintunReceivePacket)(WINTUN_SESSION_HANDLE Session, DWORD* PacketSize);
typedef void (WINAPI *PFN_WintunReleaseReceivePacket)(WINTUN_SESSION_HANDLE Session, const BYTE* Packet);
typedef BYTE* (WINAPI *PFN_WintunAllocateSendPacket)(WINTUN_SESSION_HANDLE Session, DWORD PacketSize);
typedef void (WINAPI *PFN_WintunSendPacket)(WINTUN_SESSION_HANDLE Session, const BYTE* Packet);

// Function pointers to real DLL
static PFN_WintunCreateAdapter pfnCreateAdapter = NULL;
static PFN_WintunOpenAdapter pfnOpenAdapter = NULL;
static PFN_WintunCloseAdapter pfnCloseAdapter = NULL;
static PFN_WintunDeleteDriver pfnDeleteDriver = NULL;
static PFN_WintunGetAdapterLUID pfnGetAdapterLUID = NULL;
static PFN_WintunGetRunningDriverVersion pfnGetRunningDriverVersion = NULL;
static PFN_WintunSetLogger pfnSetLogger = NULL;
static PFN_WintunStartSession pfnStartSession = NULL;
static PFN_WintunEndSession pfnEndSession = NULL;
static PFN_WintunGetReadWaitEvent pfnGetReadWaitEvent = NULL;
static PFN_WintunReceivePacket pfnReceivePacket = NULL;
static PFN_WintunReleaseReceivePacket pfnReleaseReceivePacket = NULL;
static PFN_WintunAllocateSendPacket pfnAllocateSendPacket = NULL;
static PFN_WintunSendPacket pfnSendPacket = NULL;

// Track if adapter should be kept alive
static WINTUN_ADAPTER_HANDLE g_persistentAdapter = NULL;
static BOOL g_keepAdapterAlive = TRUE;

// Load the real wintun DLL
static BOOL LoadRealWintun(void) {
    if (hRealWintun) return TRUE;
    
    // Load from same directory with different name
    WCHAR path[MAX_PATH];
    GetModuleFileNameW(NULL, path, MAX_PATH);
    
    // Find last backslash
    WCHAR* lastSlash = wcsrchr(path, L'\\');
    if (lastSlash) {
        wcscpy(lastSlash + 1, L"wintun_real.dll");
    } else {
        wcscpy(path, L"wintun_real.dll");
    }
    
    hRealWintun = LoadLibraryW(path);
    if (!hRealWintun) {
        // Try current directory
        hRealWintun = LoadLibraryW(L"wintun_real.dll");
    }
    
    if (!hRealWintun) {
        return FALSE;
    }
    
    // Load all function pointers
    pfnCreateAdapter = (PFN_WintunCreateAdapter)GetProcAddress(hRealWintun, "WintunCreateAdapter");
    pfnOpenAdapter = (PFN_WintunOpenAdapter)GetProcAddress(hRealWintun, "WintunOpenAdapter");
    pfnCloseAdapter = (PFN_WintunCloseAdapter)GetProcAddress(hRealWintun, "WintunCloseAdapter");
    pfnDeleteDriver = (PFN_WintunDeleteDriver)GetProcAddress(hRealWintun, "WintunDeleteDriver");
    pfnGetAdapterLUID = (PFN_WintunGetAdapterLUID)GetProcAddress(hRealWintun, "WintunGetAdapterLUID");
    pfnGetRunningDriverVersion = (PFN_WintunGetRunningDriverVersion)GetProcAddress(hRealWintun, "WintunGetRunningDriverVersion");
    pfnSetLogger = (PFN_WintunSetLogger)GetProcAddress(hRealWintun, "WintunSetLogger");
    pfnStartSession = (PFN_WintunStartSession)GetProcAddress(hRealWintun, "WintunStartSession");
    pfnEndSession = (PFN_WintunEndSession)GetProcAddress(hRealWintun, "WintunEndSession");
    pfnGetReadWaitEvent = (PFN_WintunGetReadWaitEvent)GetProcAddress(hRealWintun, "WintunGetReadWaitEvent");
    pfnReceivePacket = (PFN_WintunReceivePacket)GetProcAddress(hRealWintun, "WintunReceivePacket");
    pfnReleaseReceivePacket = (PFN_WintunReleaseReceivePacket)GetProcAddress(hRealWintun, "WintunReleaseReceivePacket");
    pfnAllocateSendPacket = (PFN_WintunAllocateSendPacket)GetProcAddress(hRealWintun, "WintunAllocateSendPacket");
    pfnSendPacket = (PFN_WintunSendPacket)GetProcAddress(hRealWintun, "WintunSendPacket");
    
    return TRUE;
}

// DLL entry point
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    switch (fdwReason) {
        case DLL_PROCESS_ATTACH:
            DisableThreadLibraryCalls(hinstDLL);
            LoadRealWintun();
            break;
        case DLL_PROCESS_DETACH:
            // Don't close adapter on unload - keep it persistent!
            if (hRealWintun && !g_keepAdapterAlive) {
                FreeLibrary(hRealWintun);
            }
            break;
    }
    return TRUE;
}

// === EXPORTED FUNCTIONS ===

__declspec(dllexport) WINTUN_ADAPTER_HANDLE WINAPI WintunCreateAdapter(
    const WCHAR* Name, const WCHAR* TunnelType, const GUID* RequestedGUID) {
    if (!LoadRealWintun() || !pfnCreateAdapter) return NULL;
    
    WINTUN_ADAPTER_HANDLE adapter = pfnCreateAdapter(Name, TunnelType, RequestedGUID);
    
    // Save reference for persistence
    if (adapter) {
        g_persistentAdapter = adapter;
    }
    
    return adapter;
}

__declspec(dllexport) WINTUN_ADAPTER_HANDLE WINAPI WintunOpenAdapter(const WCHAR* Name) {
    if (!LoadRealWintun() || !pfnOpenAdapter) return NULL;
    
    WINTUN_ADAPTER_HANDLE adapter = pfnOpenAdapter(Name);
    
    if (adapter) {
        g_persistentAdapter = adapter;
    }
    
    return adapter;
}

// *** THIS IS THE KEY FUNCTION ***
// We intercept CloseAdapter and DO NOTHING - adapter stays open!
__declspec(dllexport) void WINAPI WintunCloseAdapter(WINTUN_ADAPTER_HANDLE Adapter) {
    // INTENTIONALLY DO NOTHING!
    // This keeps the adapter alive even when OpenConnect tries to close it.
    // The adapter will persist until system reboot or manual cleanup.
    
    // Uncomment below to actually close (for debugging):
    // if (pfnCloseAdapter) pfnCloseAdapter(Adapter);
}

// Also intercept DeleteDriver - don't let it unload!
__declspec(dllexport) BOOL WINAPI WintunDeleteDriver(void) {
    // INTENTIONALLY DO NOTHING!
    // Return TRUE to pretend we deleted it (but we didn't)
    return TRUE;
}

// Pass-through functions
__declspec(dllexport) BOOL WINAPI WintunGetAdapterLUID(WINTUN_ADAPTER_HANDLE Adapter, void* Luid) {
    if (!LoadRealWintun() || !pfnGetAdapterLUID) return FALSE;
    return pfnGetAdapterLUID(Adapter, Luid);
}

__declspec(dllexport) DWORD WINAPI WintunGetRunningDriverVersion(void) {
    if (!LoadRealWintun() || !pfnGetRunningDriverVersion) return 0;
    return pfnGetRunningDriverVersion();
}

__declspec(dllexport) void WINAPI WintunSetLogger(WINTUN_LOGGER_CALLBACK NewLogger) {
    if (!LoadRealWintun() || !pfnSetLogger) return;
    pfnSetLogger(NewLogger);
}

__declspec(dllexport) WINTUN_SESSION_HANDLE WINAPI WintunStartSession(
    WINTUN_ADAPTER_HANDLE Adapter, DWORD Capacity) {
    if (!LoadRealWintun() || !pfnStartSession) return NULL;
    return pfnStartSession(Adapter, Capacity);
}

__declspec(dllexport) void WINAPI WintunEndSession(WINTUN_SESSION_HANDLE Session) {
    if (!LoadRealWintun() || !pfnEndSession) return;
    pfnEndSession(Session);
}

__declspec(dllexport) HANDLE WINAPI WintunGetReadWaitEvent(WINTUN_SESSION_HANDLE Session) {
    if (!LoadRealWintun() || !pfnGetReadWaitEvent) return NULL;
    return pfnGetReadWaitEvent(Session);
}

__declspec(dllexport) BYTE* WINAPI WintunReceivePacket(WINTUN_SESSION_HANDLE Session, DWORD* PacketSize) {
    if (!LoadRealWintun() || !pfnReceivePacket) return NULL;
    return pfnReceivePacket(Session, PacketSize);
}

__declspec(dllexport) void WINAPI WintunReleaseReceivePacket(WINTUN_SESSION_HANDLE Session, const BYTE* Packet) {
    if (!LoadRealWintun() || !pfnReleaseReceivePacket) return;
    pfnReleaseReceivePacket(Session, Packet);
}

__declspec(dllexport) BYTE* WINAPI WintunAllocateSendPacket(WINTUN_SESSION_HANDLE Session, DWORD PacketSize) {
    if (!LoadRealWintun() || !pfnAllocateSendPacket) return NULL;
    return pfnAllocateSendPacket(Session, PacketSize);
}

__declspec(dllexport) void WINAPI WintunSendPacket(WINTUN_SESSION_HANDLE Session, const BYTE* Packet) {
    if (!LoadRealWintun() || !pfnSendPacket) return;
    pfnSendPacket(Session, Packet);
}
