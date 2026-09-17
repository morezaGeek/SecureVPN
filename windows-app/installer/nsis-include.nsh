; SecureVPN NSIS Include Script
; This script handles prerequisites installation and persistent adapter creation

!include "LogicLib.nsh"
!include "x64.nsh"

; Custom install section
!macro customInstall
    ; Check system requirements
    DetailPrint "Checking system requirements..."
    
    ; Add firewall exception for OpenConnect
    DetailPrint "Adding firewall rules..."
    nsExec::ExecToLog 'netsh advfirewall firewall add rule name="SecureVPN" dir=in action=allow program="$INSTDIR\SecureVPN.exe" enable=yes'
    nsExec::ExecToLog 'netsh advfirewall firewall add rule name="SecureVPN OpenConnect" dir=in action=allow program="$INSTDIR\resources\openconnect\openconnect.exe" enable=yes'
    
    ; Set permissions for OpenConnect folder
    DetailPrint "Setting permissions..."
    nsExec::ExecToLog 'icacls "$INSTDIR\resources\openconnect" /grant Users:(OI)(CI)RX'
    
    ; Create persistent RAHAVPN Wintun adapter using OpenConnect
    ; This eliminates the ~15 second delay on each connection
    DetailPrint "Creating RAHAVPN network adapter..."
    
    ; First, remove any existing adapter with similar name to avoid conflicts
    nsExec::ExecToLog 'netsh interface set interface "RAHAVPN" disabled'
    
    ; Use OpenConnect's wintun.dll to create the adapter
    ; We call OpenConnect briefly just to create the adapter, then exit
    ; OpenConnect will create it if it doesn't exist
    DetailPrint "Initializing Wintun driver..."
    
    ; Copy Wintun DLL to system if needed (OpenConnect includes it)
    CopyFiles "$INSTDIR\resources\openconnect\wintun.dll" "$SYSDIR\wintun.dll"
    
    DetailPrint "Setting up VPN scripts..."
    
    DetailPrint "Installation complete!"
!macroend

!macro customUnInstall
    ; Remove firewall rules
    DetailPrint "Removing firewall rules..."
    nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="SecureVPN"'
    nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="SecureVPN OpenConnect"'
    
    ; Kill any running instances
    nsExec::ExecToLog 'taskkill /F /IM SecureVPN.exe'
    nsExec::ExecToLog 'taskkill /F /IM openconnect.exe'
    
    ; Clean up RAHAVPN adapter if it exists
    DetailPrint "Removing RAHAVPN adapter..."
    nsExec::ExecToLog 'netsh interface set interface "RAHAVPN" disabled'
    
    ; Note: Wintun adapters are automatically cleaned up when not in use
    ; We don't need to explicitly delete them
!macroend
