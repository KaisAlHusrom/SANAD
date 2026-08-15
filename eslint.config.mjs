import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import nx from '@nx/eslint-plugin';
import sanad from './tools/lint/index.mjs';
import {
  MS3_BARE_EMIT_ALLOWED_PATHS,
  MS3_BARE_EMIT_SELECTORS,
} from './tools/lint/ms3-bare-emit/index.mjs';

// Derived from this file's own URL, so it is right whether eslint runs from the repo root
// (lint-staged, CI) or from a project directory (`nx lint`).
const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));
const u26Baseline = JSON.parse(
  readFileSync(
    new URL(
      './tools/lint/u26-logic-unit-folder/baseline.json',
      import.meta.url,
    ),
    'utf8',
  ),
).paths;

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    // Generated + vendored code is never linted. These must live HERE, not only in the
    // per-project config: lint-staged runs `eslint` from the repo root, and flat config
    // loads exactly one file, so apps/*/eslint.config.mjs never applies at pre-commit.
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/.next',
      '**/next-env.d.ts',
      '**/vendor/**',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ---- scope axis: a service scope may use only its own scope + shared ----
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:gateway',
              onlyDependOnLibsWithTags: ['scope:gateway', 'scope:shared'],
            },
            {
              sourceTag: 'scope:identity',
              onlyDependOnLibsWithTags: ['scope:identity', 'scope:shared'],
            },
            {
              sourceTag: 'scope:settings',
              onlyDependOnLibsWithTags: ['scope:settings', 'scope:shared'],
            },
            {
              sourceTag: 'scope:content',
              onlyDependOnLibsWithTags: ['scope:content', 'scope:shared'],
            },
            {
              sourceTag: 'scope:media',
              onlyDependOnLibsWithTags: ['scope:media', 'scope:shared'],
            },
            {
              sourceTag: 'scope:notifications',
              onlyDependOnLibsWithTags: ['scope:notifications', 'scope:shared'],
            },
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'],
            },
            // ---- type axis: layering. types (contracts) depend on nothing internal ----
            {
              sourceTag: 'type:types',
              onlyDependOnLibsWithTags: ['type:types'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:types'],
            },
            {
              // presentational UI (e.g. @sanad/web-ui) — browser-safe, never reaches data-access
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:types'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:util',
                'type:types',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:data-access',
                'type:ui',
                'type:util',
                'type:types',
              ],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:app',
                'type:feature',
                'type:data-access',
                'type:ui',
                'type:util',
                'type:types',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
      // `_`-prefixed args are intentional unused params (e.g. override-hook seams in
      // the base repository); ignore them by the conventional naming.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    // U26 — a logic unit is a FOLDER holding its source and its spec. Registered HERE, at the
    // root, because lint-staged runs eslint from the repo root (flat config loads exactly one
    // file) and the six backend services have no project-level config at all.
    //
    // The baseline is a RATCHET, not a debt plan: the pre-rule tree is grandfathered and
    // counted, every NEW file must comply, and a listed file that a later phase touches is
    // moved and struck from the list — which the rule enforces by erroring on a baselined
    // path that now complies (owner directive, 2026-08-08).
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '**/db/migrations/**',
      '**/drizzle/**',
      '**/test/**',
      '**/fixtures/**',
      '**/*.config.ts',
      '**/*.config.mts',
      '**/main.ts',
      '**/main.tsx',
      '**/*.d.ts',
    ],
    plugins: { sanad },
    rules: {
      'sanad/u26-logic-unit-folder': [
        'error',
        { workspaceRoot, baseline: u26Baseline },
      ],
    },
  },
  {
    // MS3/U27 — a domain event is published from the transactional Outbox relay and nowhere
    // else. The selectors live in `tools/lint/ms3-bare-emit/` so this config and the spec that
    // probes them read the same source (U3): the FIRST draft here matched only
    // `callee.object.name`, which is an Identifier — so `this.client.emit(...)`, the form every
    // NestJS publisher actually uses, walked straight past it. A guard nobody probed is a guard
    // that silently rots.
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'libs/**/*.ts', 'libs/**/*.tsx'],
    ignores: MS3_BARE_EMIT_ALLOWED_PATHS,
    rules: {
      'no-restricted-syntax': ['error', ...MS3_BARE_EMIT_SELECTORS],
    },
  },
  {
    // N14 — application services NEVER reach the database directly. The `DRIZZLE` handle
    // is injected ONLY into repositories (N1) + infrastructure (outbox relay / seed),
    // never the application layer. A service depends on repositories; for an atomic
    // multi-write (business row + Outbox, MS3) it injects a TransactionRunner port and
    // passes the `tx` to repos — never the raw db. (outbox/ and seed/ are not application/,
    // so they are correctly out of scope.)
    files: ['**/application/**/*.service.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@sanad/database',
              importNames: ['DRIZZLE'],
              message:
                'N14: application services must not inject the DB handle. Depend on a repository (N1); for an atomic multi-write inject a TransactionRunner port, not DRIZZLE.',
            },
          ],
        },
      ],
    },
  },
];
