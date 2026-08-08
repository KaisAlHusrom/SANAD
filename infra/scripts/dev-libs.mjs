#!/usr/bin/env node
// The SOLE writer of the shared libs/*/dist (OPS2) — runs in the dedicated `libs-builder`
// container. Builds every shared lib ONCE (Nx tsc build; decorator metadata preserved),
// writes a readiness marker the app containers gate on (`depends_on: libs-builder healthy`),
// then rebuilds on any lib `src` change (debounced; Nx cache means only the changed lib
// actually recompiles).
//
// This removes the old "shared-dist cascade": previously every service's `nx serve`
// (`dependsOn: ["^build"]`) rewrote libs/*/dist on start, so any service (re)start churned
// the shared dist and crash-looped every sibling's watcher, and concurrent builds left dist
// half-written (`ERR_MODULE_NOT_FOUND`). With a single writer, that can no longer happen.
//
// Usage: node infra/scripts/dev-libs.mjs   (run with cwd = /workspace)

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import chokidar from 'chokidar';

const WORKSPACE = '/workspace';
// Nx project names (from each lib package.json `nx.name`), in no particular order —
// Nx resolves the build order from the dependency graph.
const PROJECTS = 'contracts,config,util,database,messaging,auth,cache,web-ui';
const MARKER_DIR = `${WORKSPACE}/.nx`;
const MARKER = `${MARKER_DIR}/.libs-ready`;
const DEBOUNCE_MS = 400;

function build() {
  return new Promise((resolve) => {
    const p = spawn(
      'pnpm',
      ['exec', 'nx', 'run-many', '-t', 'build', `--projects=${PROJECTS}`],
      { cwd: WORKSPACE, stdio: 'inherit' },
    );
    p.on('exit', (code) => resolve(code ?? 1));
  });
}

// Initial build gates the whole stack — fail the container if it can't produce the libs.
const first = await build();
if (first !== 0) {
  console.error('[dev-libs] initial shared-lib build failed');
  process.exit(1);
}
mkdirSync(MARKER_DIR, { recursive: true });
writeFileSync(MARKER, 'ready');
console.log(
  '[dev-libs] shared libs built — marker written, watching for changes',
);

// Rebuild on lib src edits, serialized + debounced so we never run two builds at once.
let debounce = null;
let building = false;
let queued = false;

async function rebuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  await build();
  building = false;
  if (queued) {
    queued = false;
    rebuild();
  }
}

// chokidar v5 DROPPED glob support → watch the concrete libs tree and filter with a
// function (react to SRC edits; never to our own dist writes, which would loop). usePolling
// is REQUIRED on Docker Desktop macOS: host edits do NOT raise native fsevents across the
// VirtioFS bind mount, so only polling detects them.
const isIgnored = (p) =>
  /(^|\/)node_modules(\/|$)/.test(p) || /(^|\/)dist(\/|$)/.test(p);
const watcher = chokidar.watch(`${WORKSPACE}/libs`, {
  ignoreInitial: true,
  usePolling: true,
  interval: 400,
  binaryInterval: 400,
  ignored: isIgnored,
});
watcher.on('all', () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(rebuild, DEBOUNCE_MS);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    watcher.close().finally(() => process.exit(0));
  });
}
