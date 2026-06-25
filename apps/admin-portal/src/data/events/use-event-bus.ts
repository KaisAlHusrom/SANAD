import { useEffect, useRef } from 'react';
import type { DomainEventOf, DomainEventType } from './domain-event.types';
import { eventBus } from './event-bus';

/**
 * Subscribe a component to a domain event for its lifetime (W4/F5). The handler is
 * kept in a ref so re-renders don't churn the subscription; resubscribes only if the
 * event type changes.
 */
export function useEventBus<T extends DomainEventType>(
  type: T,
  handler: (event: DomainEventOf<T>) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return eventBus.subscribeTo(type, (event) => handlerRef.current(event));
  }, [type]);
}
