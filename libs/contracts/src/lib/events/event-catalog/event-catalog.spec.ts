import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EVENT_ACTORS } from '../event-actor.js';
import type { EventDefinition } from '../event-definition.types.js';
import { EVENT_CATALOG } from './event-catalog.js';

// `libs/contracts/src/lib/events/event-catalog/` → the workspace root.
const WORKSPACE_ROOT = fileURLToPath(
  new URL('../../../../../../', import.meta.url),
);

// Widened to the declared union on purpose: these assertions are about the LAW every entry
// must satisfy, not about any one entry's literal type.
const entries: [string, EventDefinition][] = Object.entries(EVENT_CATALOG);

/** A reason must name the phase that owns the consumer — "later" is not a reason (U27d). */
const PHASE_REFERENCE = /P(8\.\d+|9|1\d)/;
const BROKER_NAME = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;
const MIN_ORPHAN_REASON = 60;

describe('EVENT_CATALOG (U27)', () => {
  it('declares every event exactly once, keyed by its own wire name', () => {
    for (const [key, event] of entries) {
      expect(event.name).toBe(key);
    }
    expect(new Set(entries.map(([key]) => key)).size).toBe(entries.length);
  });

  it('holds the events the platform emits today — 5 on the broker, 22 on the client bus', () => {
    const broker = entries.filter(([, event]) => event.transport === 'broker');
    const clientBus = entries.filter(
      ([, event]) => event.transport === 'client-bus',
    );
    expect(broker).toHaveLength(5);
    expect(clientBus).toHaveLength(22);
    expect(entries).toHaveLength(27);
  });

  it('carries a strict object schema for every payload (U16/N7)', () => {
    for (const [key, event] of entries) {
      expect(event.payloadSchema, key).toBeInstanceOf(z.ZodObject);
      expect(
        (event.payloadSchema as z.AnyZodObject)._def.unknownKeys,
        key,
      ).toBe('strict');
    }
  });

  it('either lists a consumer or states why nothing reacts yet (U27d)', () => {
    for (const [key, event] of entries) {
      if (event.consumers.length > 0) {
        expect(event.orphanReason, key).toBeUndefined();
        continue;
      }
      const reason = event.orphanReason ?? '';
      expect(reason.length, `${key} orphan reason`).toBeGreaterThanOrEqual(
        MIN_ORPHAN_REASON,
      );
      expect(reason, `${key} orphan reason names its owning phase`).toMatch(
        PHASE_REFERENCE,
      );
    }
  });

  it('points at producers and consumers that actually exist on disk', () => {
    for (const [key, event] of entries) {
      expect(
        existsSync(`${WORKSPACE_ROOT}${event.producedAt}`),
        `${key} producedAt`,
      ).toBe(true);
      for (const consumer of event.consumers) {
        expect(
          existsSync(`${WORKSPACE_ROOT}${consumer.at}`),
          `${key} ← ${consumer.at}`,
        ).toBe(true);
      }
    }
  });

  it('names only real actors, and broker events follow `<entity>.<event>`', () => {
    for (const [key, event] of entries) {
      expect(EVENT_ACTORS, key).toContain(event.producer);
      for (const consumer of event.consumers) {
        expect(EVENT_ACTORS, `${key} ← ${consumer.at}`).toContain(
          consumer.actor,
        );
      }
      if (event.transport === 'broker') {
        expect(key).toMatch(BROKER_NAME);
      }
    }
  });

  it('describes every event and every reaction in prose a reviewer can audit', () => {
    for (const [key, event] of entries) {
      expect(event.description.length, key).toBeGreaterThan(20);
      for (const consumer of event.consumers) {
        expect(
          consumer.reacts.length,
          `${key} ← ${consumer.at}`,
        ).toBeGreaterThan(20);
      }
    }
  });
});
