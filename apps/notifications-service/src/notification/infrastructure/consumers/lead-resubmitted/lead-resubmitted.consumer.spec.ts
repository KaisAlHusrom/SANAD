import type { RmqContext } from '@nestjs/microservices';
import type { LeadResubmittedEvent } from '@sanad/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { LeadNotificationService } from '../../../application/services/index.js';
import { LeadResubmittedConsumer } from './lead-resubmitted.consumer.js';

const event: LeadResubmittedEvent = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Layla',
  email: 'layla@example.com',
  phone: '+966501234567',
  message: 'Bumping this.',
  source: 'contact',
  locale: 'ar',
  submissionCount: 2,
  occurredAt: '2026-08-19T00:00:00.000Z',
};

function harness(handle: () => Promise<void> = () => Promise.resolve()) {
  const ack = vi.fn();
  const nack = vi.fn();
  const message = { id: 'msg' };
  const context = {
    getChannelRef: () => ({ ack, nack }),
    getMessage: () => message,
  } as unknown as RmqContext;
  const service = {
    handleLeadResubmitted: vi.fn(handle),
  } as unknown as LeadNotificationService;
  return {
    ack,
    nack,
    message,
    service,
    consumer: new LeadResubmittedConsumer(service),
    context,
  };
}

describe('LeadResubmittedConsumer (MS6)', () => {
  it('notifies then acks a valid event', async () => {
    const h = harness();
    await h.consumer.handle(event, h.context);
    expect(h.service.handleLeadResubmitted).toHaveBeenCalledWith(event);
    expect(h.ack).toHaveBeenCalledWith(h.message);
    expect(h.nack).not.toHaveBeenCalled();
  });

  it('dead-letters a poison payload instead of requeueing it forever', async () => {
    const h = harness();
    await h.consumer.handle({ nonsense: true }, h.context);
    expect(h.service.handleLeadResubmitted).not.toHaveBeenCalled();
    expect(h.nack).toHaveBeenCalledWith(h.message, false, false);
  });

  it('drops — never infinitely requeues — a transient failure', async () => {
    const h = harness(() => Promise.reject(new Error('smtp down')));
    await h.consumer.handle(event, h.context);
    expect(h.nack).toHaveBeenCalledWith(h.message, false, false);
    expect(h.ack).not.toHaveBeenCalled();
  });
});
