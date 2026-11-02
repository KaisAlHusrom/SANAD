#!/usr/bin/env node
// Creates infra/.env.development from the committed example with a fresh RS256 JWT keypair, so a
// private key never has to live in git. `--print` only prints a new pair (for staging/prod files).
//
// Usage:
//   node infra/scripts/dev-env-init.mjs              # create infra/.env.development
//   node infra/scripts/dev-env-init.mjs --out <file> # create another env file from the example
//   node infra/scripts/dev-env-init.mjs --print      # print a fresh JWT_PRIVATE_KEY / JWT_PUBLIC_KEY
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INFRA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = resolve(INFRA_DIR, '.env.example');

const args = process.argv.slice(2);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function targetPath() {
  const index = args.indexOf('--out');
  if (index === -1) return resolve(INFRA_DIR, '.env.development');
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail('--out needs a file path.');
  return resolve(value);
}

// The env accessors take the PEM on one line with literal \n and restore the newlines.
const singleLine = (pem) => pem.trim().replace(/\n/g, '\\n');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const keys = {
  JWT_PRIVATE_KEY: singleLine(privateKey),
  JWT_PUBLIC_KEY: singleLine(publicKey),
};

if (args.includes('--print')) {
  for (const [name, value] of Object.entries(keys))
    console.log(`${name}=${value}`);
  process.exit(0);
}

const target = targetPath();
if (existsSync(target)) {
  fail(
    `${target} already exists, not overwriting it. Use --print and paste the keys in yourself.`,
  );
}

let env = readFileSync(EXAMPLE, 'utf8');
for (const [name, value] of Object.entries(keys)) {
  const line = new RegExp(`^${name}=.*$`, 'm');
  if (!line.test(env)) fail(`${EXAMPLE} has no ${name}= line.`);
  env = env.replace(line, () => `${name}=${value}`);
}
writeFileSync(target, env, { mode: 0o600 });
console.log(`Created ${target} with a fresh RS256 JWT keypair.`);
