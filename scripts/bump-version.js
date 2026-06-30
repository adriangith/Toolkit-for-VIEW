const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'manifest.json');
const packagePath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data, spaces) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, spaces) + '\n');
}

const manifest = readJson(manifestPath);
const pkg = readJson(packagePath);
const packageLock = fs.existsSync(packageLockPath) ? readJson(packageLockPath) : undefined;
const currentVersion = manifest.version;
const parts = currentVersion.split('.').map(Number);

while (parts.length < 4) {
    parts.push(0);
}

parts[parts.length - 1]++;

const newVersion = parts.join('.');
console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

manifest.version = newVersion;
pkg.version = newVersion;

if (packageLock) {
    packageLock.version = newVersion;
    if (packageLock.packages && packageLock.packages['']) {
        packageLock.packages[''].version = newVersion;
    }
}

writeJson(manifestPath, manifest, 4);
writeJson(packagePath, pkg, 2);
if (packageLock) writeJson(packageLockPath, packageLock, 2);
