import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';
import { defineCatalog } from './define-catalog.js';

const base = {
  transport: 'broker',
  payloadSchema: z.object({ id: z.string() }).strict(),
  producer: 'content-service',
  producedAt: 'libs/contracts/src/lib/events/define-catalog/define-catalog.ts',
  description: 'A fixture event used to prove the catalog constraints hold.',
} as const;

const consumer = {
  actor: 'notifications-service',
  at: 'libs/contracts/src/lib/events/define-catalog/define-catalog.ts',
  reacts: 'Nothing — this is a type-level fixture, not a real subscription.',
} as const;

describe('defineCatalog (U27c)', () => {
  it('returns the catalog unchanged — it exists for its type constraint alone', () => {
    const wired = {
      name: 'fixture.wired',
      ...base,
      consumers: [consumer],
    } as const satisfies EventDefinition;

    const catalog = defineCatalog({ 'fixture.wired': wired });

    expect(catalog['fixture.wired']).toBe(wired);
  });

  it('accepts an orphan that states its reason', () => {
    const orphan = {
      name: 'fixture.orphan',
      ...base,
      consumers: [],
      orphanReason:
        'Nothing consumes this fixture; P8.7 uses it only to prove the orphan branch of the union compiles.',
    } as const satisfies EventDefinition;

    expect(defineCatalog({ 'fixture.orphan': orphan })['fixture.orphan']).toBe(
      orphan,
    );
  });

  // The probes below assert a compile ERROR exists. `@ts-expect-error` is the opposite of
  // `@ts-ignore` (U4): it fails the build when the error stops happening, so each one is a
  // live test of a catalog law rather than a silenced complaint.
  it('rejects the shapes U27 forbids — proven at compile time', () => {
    const misKeyed = {
      name: 'fixture.a',
      ...base,
      consumers: [consumer],
    } as const;
    // @ts-expect-error U27c: the key must equal the entry's own `name`.
    defineCatalog({ 'fixture.b': misKeyed });

    const reasonlessOrphan = {
      name: 'fixture.reasonless',
      ...base,
      consumers: [],
    } as const;
    // @ts-expect-error U27d: an orphan MUST say why nothing reacts yet.
    defineCatalog({ 'fixture.reasonless': reasonlessOrphan });

    const bothAtOnce = {
      name: 'fixture.both',
      ...base,
      consumers: [consumer],
      orphanReason:
        'An entry with real consumers is not an orphan and may not claim to be.',
    } as const;
    // @ts-expect-error U27d: `orphanReason` is `never` once a consumer is declared.
    defineCatalog({ 'fixture.both': bothAtOnce });

    const unknownActor = {
      name: 'fixture.actor',
      ...base,
      producer: 'ministry-of-silly-walks',
      consumers: [consumer],
    } as const;
    // @ts-expect-error U27c: producers come from the closed EVENT_ACTORS union.
    defineCatalog({ 'fixture.actor': unknownActor });

    expect(true).toBe(true);
  });
});
