import { Controller } from '@nestjs/common';
import { Audited } from '@sanad/audit';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_LEAD_LIST,
  CONTENT_LEAD_SUBMIT,
  CONTENT_LEAD_UPDATE,
  leadCreateRequestSchema,
  leadListQuerySchema,
  leadUpdateSchema,
  type Lead,
  type LeadCreateRequest,
  type LeadId,
  type LeadListQuery,
  type LeadUpdateRequest,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { LeadService } from '../application/services/lead/lead.service.js';

/**
 * RMQ entrypoints for leads (MS2). Thin — validate + delegate (U5). The gateway makes
 * `submit` PUBLIC (the website form, unauthenticated) and guards list/update with
 * `content.manage` (the admin inbox, MS4).
 */
@Controller()
export class LeadMessageController {
  constructor(private readonly leads: LeadService) {}

  // Opens the audit actor scope around the handler from the forwarded RMQ headers (MS4 + P8.8).
  // A public submit is unauthenticated, so the actor is `anonymous` WITH the real client ip,
  // user-agent and request id — exactly the trail an anti-abuse phase needs. `LeadService`
  // records the row itself, on both the create and the fold path.
  @Audited({ action: 'lead.submitted', entityType: 'lead' })
  @MessagePattern(CONTENT_LEAD_SUBMIT)
  submit(
    @Payload(new ZodValidationPipe(leadCreateRequestSchema))
    body: LeadCreateRequest,
  ): Promise<LeadId> {
    return this.leads.submit(body);
  }

  @MessagePattern(CONTENT_LEAD_LIST)
  list(
    @Payload(new ZodValidationPipe(leadListQuerySchema)) query: LeadListQuery,
  ): Promise<Paginated<Lead>> {
    return this.leads.list(query);
  }

  @MessagePattern(CONTENT_LEAD_UPDATE)
  update(
    @Payload(new ZodValidationPipe(leadUpdateSchema)) body: LeadUpdateRequest,
  ): Promise<Lead> {
    return this.leads.updateStatus(body);
  }
}
