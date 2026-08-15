import u26LogicUnitFolder from './u26-logic-unit-folder/u26-logic-unit-folder.mjs';

/**
 * The workspace's own ESLint plugin — the rules that encode this repo's layout law where a
 * built-in rule cannot. Registered ONCE, in the root `eslint.config.mjs`: lint-staged runs
 * eslint from the repo root, flat config loads exactly one file, and the six backend services
 * have no project-level config at all.
 */
const plugin = {
  meta: { name: 'sanad', version: '1.0.0' },
  rules: {
    'u26-logic-unit-folder': u26LogicUnitFolder,
  },
};

export default plugin;
