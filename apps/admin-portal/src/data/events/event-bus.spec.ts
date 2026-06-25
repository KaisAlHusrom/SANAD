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
});
