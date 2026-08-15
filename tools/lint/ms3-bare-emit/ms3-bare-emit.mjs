/**
 * MS3/U27 — a domain event is published from the transactional Outbox relay and nowhere else.
 * A bare `<clientProxy>.emit(...)` inside an app dual-writes to DB + broker, which no type can
 * catch: `ClientProxy.emit(pattern: any, data: TInput)` accepts anything, so this rule is the
 * ONLY line of defence.
 *
 * **Deny by default, with two narrow carve-outs.** Two earlier drafts tried to enumerate the
 * handle names — first anchored (`^(client|events|…)$`), then a tail match derived from the
 * services' `<service>Client` convention. Both leaked, and the second leaked at the worst
 * possible site: `apps/api-gateway` injects five proxies named plainly after their service
 * (`content`, `identity`, `notifications`, `settings`, `media`), and the gateway **has no
 * database**, so an `emit` there can never be paired with an Outbox row — the one place the
 * rule could only ever be right was the one place it stayed silent. Enumeration cannot
 * converge: every future injected handle is unguarded until someone remembers the regex.
 *
 * So: every `.emit(` in `apps/**` is a violation unless it is one of
 *   - `this.emit(...)`      — a store notifying its own subscribers (no broker involved);
 *   - `<x>Emitter.emit(...)` — an in-process event bus, which N6 permits WITHIN a service.
 * Measured when inverted: **zero** hits across `apps/**` today, so it costs nothing now and
 * closes the door on everything later.
 *
 * Exported (rather than inlined in `eslint.config.mjs`) so the config and the spec that probes
 * it read the SAME selector (U3). A guard nobody probed is a guard that silently rots — and
 * this one rotted twice before it was inverted.
 */
const MESSAGE =
  'MS3/U27: never publish straight to the broker. Write the business row and an Outbox row in the same transaction (createOutboxRecord + OutboxStore.enqueue); the relay publishes.';

const NOT_EXEMPT =
  ":not([callee.object.type='ThisExpression'])" +
  ':not([callee.object.name=/emitter$/i])' +
  ':not([callee.object.property.name=/emitter$/i])';

export const MS3_BARE_EMIT_SELECTORS = [
  {
    selector: `CallExpression[callee.property.name='emit']${NOT_EXEMPT}`,
    message: MESSAGE,
  },
  {
    // `client['emit'](…)` — the mirror of the computed-OBJECT case, and the only other shape a
    // publisher could plausibly reach for.
    selector: `CallExpression[callee.property.type='Literal'][callee.property.value='emit']${NOT_EXEMPT}`,
    message: MESSAGE,
  },
];

/**
 * The one sanctioned publisher: the Outbox relay, which is the whole point of MS3. Everything
 * else under `libs/**` is guarded too — a future shared lib must not grow a direct publish path.
 */
export const MS3_BARE_EMIT_ALLOWED_PATHS = [
  'libs/shared/messaging/src/lib/nest/outbox/**',
];
