const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../manifest.json');
const packagePath = path.resolve(__dirname, '../package.json');

// Read files
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = manifest.version;
const parts = currentVersion.split('.').map(Number);

// Ensure we have at least 4 parts (e.g., 1.0.0 -> 1.0.0.0)
while (parts.length < 4) {
    parts.push(0);
}

// Increment the last number
parts[parts.length - 1]++;

const newVersion = parts.join('.');
console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

manifest.version = newVersion;
pkg.version = newVersion;

// Write back to files (preserving indentation)
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n');
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');