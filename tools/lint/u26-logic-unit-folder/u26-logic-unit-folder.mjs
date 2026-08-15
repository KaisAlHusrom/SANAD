import { existsSync } from 'node:fs';
import { basename, dirname, relative } from 'node:path';

/**
 * Role suffixes that mark a file as DECLARATION-ONLY. U26 lists these as belonging loose in
 * their kind folder — many of one role together is correct. `types` covers `*.zod.types.ts`
 * too, since only the last dot-segment is read.
 */
const DECLARATION_SUFFIXES = new Set([
  'types',
  'constants',
  'tokens',
  'event',
  'table',
  'schema',
  'enum',
  'errors',
  'permission',
  'contract',
  'definition',
  'module',
  'config',
  'd',
]);

/** Exact basenames that are never a logic unit of their own. */
const DECLARATION_NAMES = new Set([
  'index',
  'main',
  'env',
  'setup',
  'polyfills',
  'test-setup',
  'message-pattern',
]);

/**
 * Role suffixes that mark a file as carrying LOGIC. Kept verbatim in step with the U26 bullet
 * in `.claude/agents/verifier.md` so the two halves of the enforcement never disagree.
 */
const LOGIC_SUFFIXES = new Set([
  'service',
  'controller',
  'message-controller',
  'resolver',
  'repository',
  'mapper',
  'assembler',
  'validator',
  'validate',
  'seeder',
  'seed',
  'consumer',
  'guard',
  'strategy',
  'interceptor',
  'filter',
  'pipe',
  'registry',
  'adapter',
  'store',
  'client',
  'api',
  'slice',
  'util',
  'utils',
  'helper',
  'helpers',
  'factory',
  'writer',
  'reader',
  'relay',
  'runner',
  'worker',
  'hasher',
  'hook',
]);

const SPEC_EXTENSIONS = ['.spec.ts', '.spec.tsx', '.test.ts', '.test.tsx'];

/** kebab-case a PascalCase/camelCase name, lowercase the rest, and drop a leading `use-`. */
function normalize(name) {
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
  return kebab.startsWith('use-') ? kebab.slice('use-'.length) : kebab;
}

/** Strip `.ts`/`.tsx`, then split off a trailing role suffix. */
function splitRole(file) {
  const withoutExtension = file.replace(/\.tsx?$/, '');
  const lastDot = withoutExtension.lastIndexOf('.');
  if (lastDot <= 0) {
    return { concept: withoutExtension, role: null };
  }
  return {
    concept: withoutExtension.slice(0, lastDot),
    role: withoutExtension.slice(lastDot + 1),
  };
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'U26 — a logic unit is a FOLDER holding its source and its spec; a declaration file is not.',
    },
    // Deliberately NOT fixable: the fix is a file move, and lint-staged runs `eslint --fix`.
    schema: [
      {
        type: 'object',
        properties: {
          workspaceRoot: { type: 'string' },
          baseline: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      logicUnitNeedsFolder:
        "U26: '{{file}}' carries logic, so it belongs in a folder named after its concept, beside its spec — move it to '{{target}}'.",
      staleBaselineEntry:
        "U26 ratchet: '{{file}}' is listed in tools/lint/u26-logic-unit-folder/baseline.json but now complies — delete the entry. The ratchet only goes down.",
    },
  },

  create(context) {
    const [{ workspaceRoot = process.cwd(), baseline = [] } = {}] =
      context.options;
    const baselined = new Set(baseline);

    return {
      Program() {
        const filename = context.filename ?? context.getFilename();
        if (!/\.tsx?$/.test(filename)) {
          return;
        }
        const relativePath = relative(workspaceRoot, filename)
          .split('\\')
          .join('/');
        const file = basename(filename);

        // A spec's home is decided by its subject, so the `<subject>.e2e.spec.ts` layer-root
        // carve-out needs no special case.
        if (SPEC_EXTENSIONS.some((extension) => file.endsWith(extension))) {
          return;
        }

        const { concept, role } = splitRole(file);
        if (DECLARATION_NAMES.has(concept) && role === null) {
          return;
        }
        // Declaration wins over the sibling-spec signal below: U26 names `errors`/`types` as
        // declaration-only even when one of them carries a tested helper.
        if (role !== null && DECLARATION_SUFFIXES.has(role)) {
          return;
        }

        const directory = dirname(filename);
        const isLogic =
          (role !== null && LOGIC_SUFFIXES.has(role)) ||
          /^use-/.test(concept) ||
          filename.endsWith('.tsx') ||
          SPEC_EXTENSIONS.some((extension) =>
            existsSync(
              `${directory}/${concept}${role === null ? '' : `.${role}`}${extension}`,
            ),
          );
        if (!isLogic) {
          return;
        }

        const complies = normalize(concept) === normalize(basename(directory));
        if (complies) {
          if (baselined.has(relativePath)) {
            context.report({
              loc: { line: 1, column: 0 },
              messageId: 'staleBaselineEntry',
              data: { file: relativePath },
            });
          }
          return;
        }
        if (baselined.has(relativePath)) {
          return;
        }
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'logicUnitNeedsFolder',
          data: {
            file,
            target: `${basename(directory)}/${normalize(concept)}/${file}`,
          },
        });
      },
    };
  },
};

export default rule;
