import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './event-bus';

describe('EventBus', () => {
  it('delivers a published event to every subscriber', () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.subscribe(a);
    bus.subscribe(b);

    bus.publish({ type: 'auth.loggedIn', userId: 'u1' });

    expect(a).toHaveBeenCalledWith({ type: 'auth.loggedIn', userId: 'u1' });
    expect(b).toHaveBeenCalledOnce();
  });

  it('subscribeTo only fires for the matching type', () => {
    const bus = new EventBus();
    const onLogin = vi.fn();
    bus.subscribeTo('auth.loggedIn', onLogin);

    bus.publish({ type: 'auth.loggedOut' });
    expect(onLogin).not.toHaveBeenCalled();

    bus.publish({ type: 'auth.loggedIn', userId: 'u2' });
    expect(onLogin).toHaveBeenCalledWith({
      type: 'auth.loggedIn',
      userId: 'u2',
    });
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe(handler);

    unsubscribe();
    bus.publish({ type: 'auth.loggedOut' });

    expect(handler).not.toHaveBeenCalled();
  });

  // The probes below assert a compile error EXISTS (U27c) — the bus union is derived from the
  // EVENT_CATALOG, so an undeclared name or a wrong payload cannot be published. Note
  // `@ts-expect-error` is the opposite of `@ts-ignore` (U4): it fails the build the moment the
  // error stops happening.
  it('refuses an event the EVENT_CATALOG does not declare', () => {
    const bus = new EventBus();

    // @ts-expect-error U27c: 'lead.exploded' is not a catalogued client-bus event.
    bus.publish({ type: 'lead.exploded' });

    // @ts-expect-error U27c: `auth.loggedIn` carries a `userId`.
    bus.publish({ type: 'auth.loggedIn' });

    // @ts-expect-error U27c: `lead.created` is a BROKER event; it never rides the client bus.
    bus.publish({ type: 'lead.created' });

    expect(true).toBe(true);
  });
});
