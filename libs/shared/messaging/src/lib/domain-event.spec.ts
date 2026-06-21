import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineEvent, type EventPayloadOf } from './domain-event.js';

const leadCreated = defineEvent(
  'lead.created',
  z.object({ leadId: z.string(), email: z.string().email() }).strict(),
);

describe('domain-event', () => {
  it('captures the routing name and validates the payload', () => {
    expect(leadCreated.name).toBe('lead.created');
    expect(
      leadCreated.schema.safeParse({ leadId: '1', email: 'a@b.com' }).success,
    ).toBe(true);
    expect(leadCreated.schema.safeParse({ leadId: '1' }).success).toBe(false);
  });

  it('infers the payload type from the contract', () => {
    const payload: EventPayloadOf<typeof leadCreated> = {
      leadId: '1',
      email: 'a@b.com',
    };
    expect(payload.leadId).toBe('1');
  });
});
