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
            '{projectRoot}/next.config.{js,cjs,mjs}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
            '{projectRoot}/src/test/**',
            '{projectRoot}/src/test-setup.ts',
            '{projectRoot}/src/**/*.spec.{ts,tsx}',
            '{projectRoot}/src/**/*.test.{ts,tsx}',
          ],
          // Next + React are runtime deps Next provides; not always statically imported.
          ignoredDependencies: ['next', 'react', 'react-dom'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    // U19/OPS1 — environment values are read through one typed accessor
    // (src/config/env/env.ts), never raw `process.env` at call sites.
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'middleware.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            'U19: read environment values through src/config/env/env.ts, never process.env directly.',
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
    // Vendored upstream three.js r128 postprocessing (the reference bloom pass) — kept verbatim,
    // not our source, so it's excluded from lint. See the header in vendor/postprocessing/Pass.js.
    ignores: [
      '**/out-tsc',
      '**/dist',
      '**/.next',
      '**/next-env.d.ts',
      'src/motion/cosmos/vendor/**',
    ],
  },
];
