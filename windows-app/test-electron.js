// Debug script to check Electron runtime environment
console.log('=== Electron Runtime Debug ===')
console.log('process.type:', process.type)
console.log('process.versions.electron:', process.versions.electron)
console.log('process.versions.chrome:', process.versions.chrome)
console.log('process.electronBinding:', typeof process.electronBinding)

// If process.type is 'browser', we're in the main process
if (process.type === 'browser') {
    console.log('\n✓ Running in Electron main process!')

    // Electron's internal module should now work
    const { app, BrowserWindow } = require('electron')
    console.log('app:', typeof app)
    console.log('BrowserWindow:', typeof BrowserWindow)

    app.whenReady().then(() => {
        console.log('Electron app is ready!')
        app.quit()
    })
} else {
    console.log('\n✗ NOT running in Electron! process.type=' + process.type)
    console.log('This script should be run with: electron.exe <script>')
    process.exit(1)
}
