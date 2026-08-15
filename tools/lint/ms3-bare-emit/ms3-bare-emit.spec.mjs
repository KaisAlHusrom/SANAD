import { RuleTester } from 'eslint';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { describe, it } from 'vitest';
import { MS3_BARE_EMIT_SELECTORS } from './ms3-bare-emit.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

/**
 * The `no-restricted-syntax` selector the root config applies to `apps/**` (MS3/U27), probed
 * both ways. The `invalid` list is not a sample of plausible names — it is every shape that
 * escaped the two earlier allow-list drafts, kept as regression cases so the rule can never
 * narrow back to enumerating handle names.
 */
tester.run(
  'no-restricted-syntax (MS3 bare emit)',
  builtinRules.get('no-restricted-syntax'),
  {
    valid: [
      {
        name: 'the Outbox path, which is the only sanctioned way to publish',
        code: "outbox.enqueue(createOutboxRecord('media.deleted', event, nowIso));",
        options: MS3_BARE_EMIT_SELECTORS,
      },
      {
        name: 'an in-process emitter (N6 permits one WITHIN a service)',
        code: "this.eventEmitter.emit('media.reconciled', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
      },
      {
        name: 'a bare in-process emitter',
        code: "emitter.emit('media.reconciled', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
      },
      {
        name: 'a store notifying its own subscribers — no broker involved',
        code: 'this.emit();',
        options: MS3_BARE_EMIT_SELECTORS,
      },
    ],
    invalid: [
      {
        name: 'a bare local ClientProxy',
        code: "client.emit('media.deleted', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'an INJECTED ClientProxy field — draft 1 matched only Identifiers and missed this',
        code: "this.client.emit('media.deleted', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'a `<service>Client` field — draft 1 anchored its allow-list and missed this',
        code: "this.settingsClient.emit('settings.changed', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: "a gateway handle named plainly after its service — draft 2's tail match missed this",
        code: "this.notifications.emit('lead.created', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'another plain gateway handle',
        code: "this.content.emit('lead.created', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'a computed member access — invisible to any name-based selector',
        code: "this['settingsClient'].emit('settings.changed', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'an aliased handle — the name is gone by the call site',
        code: "const c = this.settingsClient; c.emit('settings.changed', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'a computed PROPERTY access — the mirror of the computed-object case',
        code: "client['emit']('media.deleted', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'an optional chain',
        code: "this.settingsClient?.emit('settings.changed', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
      {
        name: 'a call-returned handle',
        code: "this.getClient().emit('settings.changed', payload);",
        options: MS3_BARE_EMIT_SELECTORS,
        errors: 1,
      },
    ],
  },
);
