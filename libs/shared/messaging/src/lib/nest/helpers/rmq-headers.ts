import type { RmqContext } from '@nestjs/microservices';

/**
 * Read the AMQP message headers a producer attached (e.g. the gateway's forwarded
 * identity, MS4) off an `RmqContext`. The caller validates the contents (services
 * trust the gateway-validated identity but still parse it). Empty when absent.
 */
export function readMessageHeaders(
  context: RmqContext,
): Record<string, unknown> {
  const message = context.getMessage() as {
    properties?: { headers?: Record<string, unknown> };
  };
  return message.properties?.headers ?? {};
}
