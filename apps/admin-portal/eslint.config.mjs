import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
            '{projectRoot}/postcss.config.{js,cjs}',
            '{projectRoot}/tailwind.config.{js,ts}',
            // test-only infrastructure (uses @testing-library/* dev deps)
            '{projectRoot}/src/test/**',
            '{projectRoot}/src/test-setup.ts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // U19 — env is read through one typed accessor; never raw `import.meta.env`
    // at call sites (the accessor validates + fails fast).
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[property.name='env'] > MetaProperty[meta.name='import'][property.name='meta']",
          message:
            'U19: read environment values through src/config/env/env.ts, never import.meta.env directly.',
        },
      ],
    },
  },
  {
    files: ['src/config/env/env.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    ignores: ['**/out-tsc', '**/dist'],
  },
];
