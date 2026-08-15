import { describe, expect, it } from 'vitest';
import { createOutboxRecord } from './outbox-record.js';

const occurredAt = '2026-08-08T10:00:00.000Z';

const mediaDeleted = {
  id: 'e7c2f0d4-1f3a-4d5e-9b6c-2a1d8e5f0c37',
  key: 'uploads/a.png',
};

describe('createOutboxRecord (MS3/U27)', () => {
  it('builds an unpublished record with a fresh idempotency id and a JSON payload', () => {
    const record = createOutboxRecord(
      'media.deleted',
      mediaDeleted,
      occurredAt,
    );

    expect(record.eventName).toBe('media.deleted');
    expect(JSON.parse(record.payload)).toEqual(mediaDeleted);
    expect(record.occurredAt).toBe(occurredAt);
    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(
      createOutboxRecord('media.deleted', mediaDeleted, occurredAt).id,
    ).not.toBe(record.id);
  });

  // The probes below assert a compile error EXISTS (U27c). `@ts-expect-error` is the opposite
  // of `@ts-ignore` (U4): it fails the build the moment the error stops happening.
  it('refuses an un-catalogued event name and a payload the catalog does not describe', () => {
    // @ts-expect-error U27c: 'lead.exploded' is not in the EVENT_CATALOG.
    createOutboxRecord('lead.exploded', mediaDeleted, occurredAt);

    // @ts-expect-error U27c: `media.deleted` carries { id, key } — `key` is missing here.
    createOutboxRecord('media.deleted', { id: mediaDeleted.id }, occurredAt);

    // @ts-expect-error U27c: a client-bus event never travels on the broker.
    createOutboxRecord('lead.updated', {}, occurredAt);

    expect(true).toBe(true);
  });
});
