import { Controller } from '@nestjs/common';
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
import { LeadService } from '../application/services/lead.service.js';

/**
 * RMQ entrypoints for leads (MS2). Thin — validate + delegate (U5). The gateway makes
 * `submit` PUBLIC (the website form, unauthenticated) and guards list/update with
 * `content.manage` (the admin inbox, MS4).
 */
@Controller()
export class LeadMessageController {
  constructor(private readonly leads: LeadService) {}

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
