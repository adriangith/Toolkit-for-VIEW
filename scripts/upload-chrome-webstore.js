const fs = require('fs');
const { spawnSync } = require('child_process');

const requiredEnv = ['EXTENSION_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN'];

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return undefined;

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) return undefined;

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return key ? [key, value] : undefined;
}

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const pair = parseEnvLine(line);
    if (pair && process.env[pair[0]] === undefined) {
      process.env[pair[0]] = pair[1];
    }
  }
}

const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing Chrome Web Store environment values: ${missingEnv.join(', ')}`);
  console.error('Set them in .env using .env.example as a template, or export them in the shell/CI environment.');
  process.exit(1);
}

const command = process.argv[2];
const args = ['chrome-webstore-upload'];
if (command) args.push(command);

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
