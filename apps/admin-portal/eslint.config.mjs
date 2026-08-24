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
        {
          // U6 — Tailwind 3.4's opacity modifier emits NO CSS at all for a `var(--token)`
          // colour, silently and with no error: `bg-bg/70` on the dialog scrim meant every
          // modal blurred the page behind it without ever dimming it. Use a named translucent
          // token from `tailwind.config.ts` (`scrim`, `veil`, `veil-surface`, `veil-accent`,
          // `bad-soft`) — or add one there — never an `/opacity` suffix on a token colour.
          // Found in 8 places at once in P8.23.A1; a defect nothing reports needs a guard.
          selector:
            'Literal[value=/(?:^|[\\s"\'`])(?:[a-z-]+:)*(?:bg|border|text|from|to|via|ring|shadow|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(?:bg|surface|surface-2|surface-3|sidebar|border|border-2|text|dim|faint|accent|accent-2|accent-3|accent-ink|accent-soft|accent-line|good|warn|bad)\\/[0-9]+/]',
          message:
            'U6: a Tailwind /opacity modifier on a token colour compiles to NOTHING (the value is a var()). Use a named translucent token — scrim / veil / veil-surface / veil-accent / bad-soft — or add one to tailwind.config.ts.',
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
