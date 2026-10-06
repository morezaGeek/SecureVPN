const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const cp = require('node:child_process');
const esbuild = require('esbuild');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'securevpn-workflow-'));
const bundle = path.join(directory, 'workflow.cjs');
try {
    esbuild.buildSync({ entryPoints: [path.join(__dirname, 'ping-workflow.test.tsx')], outfile: bundle,
        bundle: true, platform: 'node', jsx: 'automatic' });
    cp.execFileSync(process.execPath, [bundle], { stdio: 'inherit', windowsHide: true });
} finally {
    fs.rmSync(bundle, { force: true });
    fs.rmdirSync(directory);
}
