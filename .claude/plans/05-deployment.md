# 05 — Deployment & Environments

> The `infra/` setup: Docker (dev hot-reload + staging/prod), nginx + SSL, scripts, R2 backups, `APP_ENV`. A monorepo-native port of `bishola-deployment-v2` (read-only reference). Rules OPS1–OPS4 govern this.

## Three environments (OPS1)
- **development** — local, in Docker, hot-reload. Not deployed.
- **staging** — deployed; mirrors prod; `dev`/release branch.
- **production** — deployed; `main` branch.

Selected by **`APP_ENV`** (`development`|`staging`|`production`), **never `NODE_ENV`** (always `production` once built). Every app: `.env.development`, `.env.staging`, `.env.production`, committed `.env.example`; real files gitignored; read through the one typed env accessor (U19). Frontend public config (API base URL, etc.) is keyed by `APP_ENV` with a production fallback per key.

## `infra/` layout
```
infra/
├─ docker-compose.dev.yml          # full stack + hot-reload bind mounts
├─ docker-compose.staging.yml
├─ docker-compose.prod.yml
├─ docker/
│  ├─ <service>.dev.Dockerfile      # watch mode (nx serve / tsx watch / vite)
│  ├─ <service>.Dockerfile          # multi-stage, target: production
│  └─ ...
├─ nginx/
│  ├─ conf.d/ vhost.d/ certs/ acme/  # nginx-proxy + acme-companion (like bishola-deployment-v2)
├─ scripts/
│  ├─ deploy.sh  backup_db.sh  push_db.sh  renew.sh
│  ├─ health_check.sh  monitor.sh  validate_env.sh
│  └─ db_bridge.sh  db_tunnel.sh
└─ env/                              # .env.example templates per app/service
```

## Dev stack (OPS2 — the unique part)
- `docker-compose.dev.yml` brings up **everything**: api-gateway + all services + website + portals, **one Postgres** container (one **database per service** — MS5 collision guard), **Redis**, **RabbitMQ** (+ management UI), **nginx** (dev vhosts).
- App containers use **bind mounts + watch** (`nx serve <app>` / `tsx watch` / Vite HMR) so a code edit hot-reloads **without rebuild/restart**.
- Same topology as staging/prod so "works in dev" means something. `APP_ENV=development`.

## Per-service databases & migrations (MS5)
- Each service owns its DB + Drizzle config + migrations folder; migrations run as a **dedicated step/container** in deploy (`drizzle-kit migrate`, never `push` in prod), before the service container goes healthy. `COPY` the migrations folder into the image.
- Dev: one Postgres instance, distinct database per service. Staging/prod: isolated DBs (can be separate instances). Each service also has a `*_test` DB for TDD (TDD2).

## nginx + SSL (OPS3)
- `nginx-proxy` + `acme-companion` (Let's Encrypt) auto-discover containers via `VIRTUAL_HOST` / `LETSENCRYPT_HOST` labels, terminate TLS (TLS 1.2/1.3, HSTS, stapling), redirect 80→443, route each public host (website, admin, client, api) to its container. `client_max_body_size` raised for media uploads. **api-gateway is the only backend exposed**; services stay on internal networks.
- Networks: `proxy` (external) + per-env internal networks (`internal: true`) so DBs/broker aren't publicly reachable.

## Scripts (port from bishola-deployment-v2)
- **deploy.sh** `--env --service` — pull → validate env → backup DB → run migrations (dedicated service) → multi-stage build → health-check new → roll over → verify; rollback on migration failure.
- **backup_db.sh** / **push_db.sh** — per-service compressed dumps, retention, optional **Cloudflare R2** upload.
- **renew.sh** — safe SSL renewal (only if expiring < 30d, graceful reload).
- **health_check.sh** / **monitor.sh** — container + HTTP `/health` (liveness/readiness, MS8) + DB/Redis/RMQ + SSL expiry + resources; thresholds + alerts.
- **validate_env.sh** — required keys present + well-formed before deploy.
- **db_bridge.sh** / **db_tunnel.sh** — secure SSH tunnel for DB access (no public DB port).

## Images / CDN (OPS3)
App images built from source (multi-stage). Media/assets on **Cloudflare R2** + CDN (media-service). DB backups pushed to R2.

## CI/CD
Start with script-driven deploy over SSH (as in the reference). The verification gate runs in three layers (OPS4): pre-commit `lint-staged`, pre-push `nx affected -t typecheck lint test`, and **`.github/workflows/ci.yml`** (added 2026-08-08) running the full `nx run-many -t typecheck lint test build` on every push to `main` and every PR — reporting, not blocking. Deploy is **not** wired into Actions yet; when it is, it calls the same `infra/scripts/*` (they return proper exit codes) and gets its own workflow, gated on the CI one.

## Deploy order for the priority milestone (P9)
1. Provision staging host; `validate_env.sh`. 2. Deploy services (identity/settings/media/content/notifications) + gateway + admin + website to **staging**; migrate; health-check; smoke-test. 3. Promote to **production** (same flow). 4. Confirm SSL valid, health green, a DB backup produced (+ R2). Mark P9 done only on green.
