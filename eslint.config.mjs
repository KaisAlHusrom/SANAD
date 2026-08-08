import nx from '@nx/eslint-plugin';

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
