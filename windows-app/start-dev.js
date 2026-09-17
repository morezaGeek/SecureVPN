// Start script for Electron development
// This script compiles TypeScript, starts Vite dev server, then launches Electron

const { spawn, execSync } = require('child_process')
const path = require('path')

// Compile TypeScript for Electron
console.log('[Startup] Compiling Electron TypeScript...')
try {
    execSync('npx tsc -p tsconfig.electron.json', {
        cwd: __dirname,
        stdio: 'inherit'
    })
    console.log('[Startup] Electron TypeScript compiled successfully')
} catch (err) {
    console.error('[Startup] Failed to compile TypeScript:', err.message)
    process.exit(1)
}

// Get electron path
const electronPath = require('electron')

// Start Vite dev server
console.log('[Startup] Starting Vite dev server...')
const vite = spawn('cmd', ['/c', 'npx', 'vite', '--host', '127.0.0.1', '--port', '3000'], {
    cwd: __dirname,
    stdio: 'pipe'
})

let electronStarted = false

vite.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('[Vite]', output.trim())

    // When Vite is ready, start Electron
    if (!electronStarted && (output.includes('ready in') || output.includes('Local:'))) {
        electronStarted = true
        console.log('[Startup] Vite dev server ready, starting Electron...')

        // Wait a bit for Vite to be fully ready
        setTimeout(() => {
            const electronProcess = spawn(electronPath, ['.'], {
                cwd: __dirname,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    VITE_DEV_SERVER_URL: 'http://127.0.0.1:3000',
                    NODE_ENV: 'development'
                }
            })

            electronProcess.on('close', () => {
                vite.kill()
                process.exit(0)
            })
        }, 500)
    }
})

vite.stderr.on('data', (data) => {
    const output = data.toString().trim()
    if (output && !output.includes('deprecated')) {
        console.error('[Vite Error]', output)
    }
})

vite.on('close', (code) => {
    if (code !== 0) {
        console.log('[Vite] Process exited with code', code)
    }
})

process.on('SIGINT', () => {
    vite.kill()
    process.exit(0)
})
