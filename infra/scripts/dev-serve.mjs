#!/usr/bin/env node
// Dev process supervisor (OPS2) — replaces `nx serve` + `node --watch` in app containers.
//
// Why this exists (the two bugs it kills):
//   1. `nx serve` re-enters the Nx task graph and could wedge with "Recursive task
//      invocation detected (serve -> serve)", crashing the app with exit(1). We never run
//      Nx here — just SWC + node directly — so that class cannot occur.
//   2. `node --watch` does NOT restart the process on a non-zero crash (only on a later
//      file change), so a transient crash printed "Failed running 'dist/main.js'" and the
//      service stayed DEAD while Docker still showed the container "Up". This supervisor
//      ALWAYS respawns on exit (crash or clean) and also restarts on file changes.
//
// It watches this app's OWN dist (recompiled by the SWC watcher below) AND every shared
// `libs/*/dist` (rebuilt by the libs-builder container) so a shared-lib edit hot-reloads
// the service too — with a debounce that gives atomic-write safety the old setup lacked.
//
// Usage: node infra/scripts/dev-serve.mjs apps/<app-dir>   (run with cwd = /workspace)

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import chokidar from 'chokidar';

const WORKSPACE = '/workspace';
const appDir = process.argv[2];
if (!appDir) {
  console.error('[dev-serve] usage: dev-serve.mjs apps/<app-dir>');
  process.exit(1);
}

const RESTART_DEBOUNCE_MS = 300;
const RESPAWN_BACKOFF_MS = 500;
const appPath = `${WORKSPACE}/${appDir}`;

let stopping = false;

// --- 1) SWC watcher: recompiles this app's own src -> its own dist (the SOLE writer of
//        that dist). Flags unchanged from the old serve target, so decorator metadata
//        (N11) is preserved. If it dies, exit so Docker's restart policy gives a clean slate.
const swc = spawn(
  'pnpm',
  ['exec', 'swc', 'src', '-d', 'dist', '--watch', '--strip-leading-paths'],
  { cwd: appPath, stdio: 'inherit' },
);
swc.on('exit', (code) => {
  if (stopping) return;
  console.error(
    `[dev-serve] ${appDir}: SWC watcher exited (${code}); exiting for a clean container restart`,
  );
  process.exit(1);
});

// --- 2) Supervised node process: respawn on ANY exit; restart on dist changes.
//
// Respawning is SINGLE-FLIGHT. Previously a dist change arriving during the respawn backoff
// found `child === null` and spawned immediately, while the already-pending backoff timer
// spawned a second process a moment later. Two processes → `EADDRINUSE` → both crash → each
// schedules another respawn → a self-sustaining storm (observed: 59 concurrent processes),
// invisible to Docker's healthcheck because one survivor always holds the port.
let child = null;
let restarting = false;
let respawnTimer = null;

/** Queue exactly ONE pending spawn; a second request while one is queued is a no-op. */
function scheduleRespawn(delayMs) {
  if (respawnTimer) return;
  respawnTimer = setTimeout(() => {
    respawnTimer = null;
    startNode();
  }, delayMs);
}

function startNode() {
  // Never run two node processes for one app — the invariant the storm violated.
  if (child) return;
  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }
  child = spawn('node', ['--enable-source-maps', 'dist/main.js'], {
    cwd: appPath,
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    if (restarting) {
      restarting = false;
      startNode();
      return;
    }
    console.error(
      `[dev-serve] ${appDir}: process exited (code=${code} signal=${signal}); respawning in ${RESPAWN_BACKOFF_MS}ms`,
    );
    scheduleRespawn(RESPAWN_BACKOFF_MS);
  });
}

function restartNode() {
  // No live child (we're inside a backoff window) → let the single-flight path own the spawn.
  if (!child) {
    scheduleRespawn(0);
    return;
  }
  restarting = true;
  child.kill('SIGTERM');
}

// Wait for the first compiled main.js (SWC's initial pass) before the first start.
(function waitForMain() {
  if (existsSync(`${appPath}/dist/main.js`)) {
    startNode();
    return;
  }
  setTimeout(waitForMain, 200);
})();

// --- 3) Watch own dist + all shared lib dists; debounce; restart on change.
let debounce = null;
// chokidar v5 DROPPED glob support, so we watch concrete directories and filter with a
// function — never glob strings (they'd match nothing). We watch this app's own dist
// (recompiled in-container by swc) and the whole libs tree, reacting only to lib DIST
// changes (a lib SRC edit is the libs-builder's job; its resulting dist write is what
// should restart us). usePolling is REQUIRED on Docker Desktop macOS: native fsevents do
// NOT cross the VirtioFS bind mount, so a dist written by the libs-builder container (or a
// host edit) never raises a native event here — polling re-stats and catches both.
const isIgnored = (p) =>
  /(^|\/)node_modules(\/|$)/.test(p) || /(^|\/)src(\/|$)/.test(p);
// OPS9: seven containers poll this tree at once, so the interval is a CPU tax paid continuously
// on a 16 GB host shared with two other projects. 1000 ms + the restart debounce still reacts in
// ~1.4 s — imperceptible in dev — for ~2.5x less polling than the original 400 ms.
const POLL_MS = Number(process.env.DEV_WATCH_INTERVAL_MS ?? 1000);
const watcher = chokidar.watch([`${appPath}/dist`, `${WORKSPACE}/libs`], {
  ignoreInitial: true,
  usePolling: true,
  interval: POLL_MS,
  binaryInterval: POLL_MS,
  ignored: isIgnored,
});
watcher.on('all', () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(restartNode, RESTART_DEBOUNCE_MS);
});

// --- Clean shutdown so `docker compose restart` is graceful.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    stopping = true;
    if (child) child.kill('SIGTERM');
    swc.kill('SIGTERM');
    watcher.close().finally(() => process.exit(0));
  });
}
