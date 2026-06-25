import type {
  DomainEvent,
  DomainEventOf,
  DomainEventType,
} from './domain-event.types';

type Handler = (event: DomainEvent) => void;

/**
 * A tiny synchronous typed pub/sub for same-tab cross-module reactivity (W4). It is
 * NOT a replacement for RTK tag invalidation within a module — it bridges modules:
 * a mutation publishes, unrelated views subscribe and refetch (F5).
 */
export class EventBus {
  private readonly handlers = new Set<Handler>();

  /** Publish to every current subscriber (snapshot, so handlers may unsubscribe). */
  publish(event: DomainEvent): void {
    for (const handler of [...this.handlers]) {
      handler(event);
    }
  }

  /** Subscribe to all events; returns an unsubscribe function. */
  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Subscribe to a single event type, narrowed to that variant. */
  subscribeTo<T extends DomainEventType>(
    type: T,
    handler: (event: DomainEventOf<T>) => void,
  ): () => void {
    return this.subscribe((event) => {
      if (event.type === type) {
        handler(event as DomainEventOf<T>);
      }
    });
  }
}

/** The app-wide event bus singleton. */
export const eventBus = new EventBus();
