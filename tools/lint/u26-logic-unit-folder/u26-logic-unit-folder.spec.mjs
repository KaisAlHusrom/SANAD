import { fileURLToPath } from 'node:url';
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from './u26-logic-unit-folder.mjs';

// ESLint 9's RuleTester expects mocha-style globals; vitest supplies compatible ones.
RuleTester.describe = describe;
RuleTester.it = it;

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const FIXTURES = 'tools/lint/u26-logic-unit-folder/fixtures';

/** Absolute path for a repo-relative one — RuleTester `filename`s must be absolute. */
const at = (relative) => `${workspaceRoot}${relative}`;

const options = (baseline = []) => [{ workspaceRoot, baseline }];

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

tester.run('u26-logic-unit-folder', rule, {
  valid: [
    {
      name: 'a service in its own concept folder',
      code: 'export class RolesService {}',
      filename: at('apps/x/src/application/services/roles/roles.service.ts'),
      options: options(),
    },
    {
      name: 'a hook in its own concept folder',
      code: 'export function useClientList() {}',
      filename: at('apps/x/src/hooks/use-client-list/use-client-list.ts'),
      options: options(),
    },
    {
      name: "a hook in its component's folder — the `use-` prefix is stripped before comparing",
      code: 'export function useMediaExplorer() {}',
      filename: at(
        'apps/x/src/components/media-explorer/use-media-explorer.ts',
      ),
      options: options(),
    },
    {
      name: 'a PascalCase component in its kebab-case folder',
      code: 'export function DataTable() { return null; }',
      filename: at('apps/x/src/components/data-table/DataTable.tsx'),
      options: options(),
    },
    {
      name: 'a declaration-only types file, loose in its kind folder',
      // The rule reads the FILENAME, never the AST — so these samples only have to parse
      // under the default (JS) parser. Deliberate: it keeps the rule cheap and TS-agnostic.
      code: 'export const lead = {};',
      filename: at('libs/contracts/src/lib/content/lead.types.ts'),
      options: options(),
    },
    {
      name: 'a declaration-only event file, loose in its kind folder',
      code: 'export const leadCreatedEvent = {};',
      filename: at(
        'libs/contracts/src/lib/events/broker/lead-created.event.ts',
      ),
      options: options(),
    },
    {
      name: 'a spec — its home follows its subject, so the e2e carve-out is automatic',
      code: 'export {};',
      filename: at('apps/x/src/content/presentation/content.e2e.spec.ts'),
      options: options(),
    },
    {
      name: 'a barrel',
      code: 'export {};',
      filename: at('apps/x/src/application/services/index.ts'),
      options: options(),
    },
    {
      name: 'a flat logic file that is grandfathered by the baseline',
      code: 'export class LeadService {}',
      filename: at('apps/x/src/application/services/lead.service.ts'),
      options: options(['apps/x/src/application/services/lead.service.ts']),
    },
    {
      name: 'a suffix-less file with no sibling spec is a declaration until proven otherwise',
      code: 'export const LEAD_CREATED_EVENT = "lead.created";',
      filename: at('libs/contracts/src/lib/content/message-pattern.ts'),
      options: options(),
    },
    {
      name: 'a real compliant fixture on disk',
      code: 'export class CompliantUnitService {}',
      filename: at(`${FIXTURES}/compliant-unit/compliant-unit.service.ts`),
      options: options(),
    },
  ],
  invalid: [
    {
      name: 'a service loose in its kind folder',
      code: 'export class LeadService {}',
      filename: at('apps/x/src/application/services/lead.service.ts'),
      options: options(),
      errors: [
        {
          messageId: 'logicUnitNeedsFolder',
          data: {
            file: 'lead.service.ts',
            target: 'services/lead/lead.service.ts',
          },
        },
      ],
    },
    {
      name: 'a hook loose in its kind folder',
      code: 'export function useDashboard() {}',
      filename: at('apps/x/src/modules/dashboard/hooks/use-dashboard.ts'),
      options: options(),
      errors: [{ messageId: 'logicUnitNeedsFolder' }],
    },
    {
      name: 'a component loose in its kind folder',
      code: 'export function Button() { return null; }',
      filename: at('apps/x/src/components/Button.tsx'),
      options: options(),
      errors: [{ messageId: 'logicUnitNeedsFolder' }],
    },
    {
      name: 'a suffix-less file proven to be a unit by its sibling spec',
      code: 'export function flatWithSpec() {}',
      filename: at(`${FIXTURES}/flat-with-spec.ts`),
      options: options(),
      errors: [{ messageId: 'logicUnitNeedsFolder' }],
    },
    {
      name: 'a baselined path that now complies — the ratchet only goes down',
      code: 'export class CompliantUnitService {}',
      filename: at(`${FIXTURES}/compliant-unit/compliant-unit.service.ts`),
      options: options([
        `${FIXTURES}/compliant-unit/compliant-unit.service.ts`,
      ]),
      errors: [{ messageId: 'staleBaselineEntry' }],
    },
  ],
});
