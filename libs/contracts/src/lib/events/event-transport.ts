/** Which bus carries the event: RabbitMQ across services (MS3), or a same-tab client bus (W4). */
export const EVENT_TRANSPORTS = ['broker', 'client-bus'] as const;

export type EventTransport = (typeof EVENT_TRANSPORTS)[number];
