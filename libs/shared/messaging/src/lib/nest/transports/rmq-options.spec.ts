import { describe, expect, it } from 'vitest';
import { Transport } from '@nestjs/microservices';
import {
  commandsQueue,
  createRmqClientOptions,
  createRmqServerOptions,
  eventsQueue,
} from './rmq-options.js';

describe('RMQ transport options', () => {
  it('builds queue names by convention', () => {
    expect(commandsQueue('identity')).toBe('identity.commands');
    expect(eventsQueue('identity')).toBe('identity.events');
  });

  it('server options use manual ack + durable + prefetch (MS6)', () => {
    const options = createRmqServerOptions({
      url: 'amqp://localhost',
      queue: 'identity.commands',
      prefetchCount: 5,
    });
    expect(options.transport).toBe(Transport.RMQ);
    expect(options.options?.noAck).toBe(false);
    expect(options.options?.prefetchCount).toBe(5);
    expect(options.options?.queueOptions?.durable).toBe(true);
  });

  it('client options target a durable queue', () => {
    const options = createRmqClientOptions({
      url: 'amqp://localhost',
      queue: 'identity.commands',
    });
    expect(options.options?.urls).toEqual(['amqp://localhost']);
    expect(options.options?.queueOptions?.durable).toBe(true);
  });
});
