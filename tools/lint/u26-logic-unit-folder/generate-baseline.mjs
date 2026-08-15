import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import sanad from '../index.mjs';

/**
 * Regenerate the U26 ratchet. Run with `nx run lint-rules:baseline`.
 *
 * It lints the repo with the REAL rule and an EMPTY baseline, so the generator and the
 * enforcer can never disagree about what counts as a violation. `maxPaths` is written to the
 * count it just measured — a number that may only ever go down, which is what stops someone
 * widening the ratchet to sneak a new violation in.
 */
const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const BASELINE_PATH = new URL('./baseline.json', import.meta.url);

const eslint = new ESLint({
  cwd: WORKSPACE_ROOT,
  overrideConfigFile: `${WORKSPACE_ROOT}eslint.config.mjs`,
  // Same plugin OBJECT the root config registers (flat config rejects a redefinition with a
  // different instance), re-armed with an EMPTY baseline so the full violation set is measured.
  overrideConfig: {
    plugins: { sanad },
    rules: {
      'sanad/u26-logic-unit-folder': [
        'error',
        { workspaceRoot: WORKSPACE_ROOT, baseline: [] },
      ],
    },
  },
});

const results = await eslint.lintFiles([
  'apps/**/*.{ts,tsx}',
  'libs/**/*.{ts,tsx}',
]);

const paths = results
  .filter((result) =>
    result.messages.some(
      (message) => message.ruleId === 'sanad/u26-logic-unit-folder',
    ),
  )
  .map((result) =>
    result.filePath.slice(WORKSPACE_ROOT.length).split('\\').join('/'),
  )
  .sort();

const previous = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const next = { ...previous, maxPaths: paths.length, paths };

if (process.argv.includes('--write')) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`U26 baseline written: ${paths.length} grandfathered files.`);
} else {
  console.log(
    `U26 violations measured: ${paths.length} (pass --write to record them).`,
  );
}
