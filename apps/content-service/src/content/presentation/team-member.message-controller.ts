import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_TEAM_MEMBER_CREATE,
  CONTENT_TEAM_MEMBER_DELETE,
  CONTENT_TEAM_MEMBER_GET,
  CONTENT_TEAM_MEMBER_LIST,
  CONTENT_TEAM_MEMBER_REORDER,
  CONTENT_TEAM_MEMBER_UPDATE,
  contentIdSchema,
  contentSlugSchema,
  reorderRequestSchema,
  teamMemberCreateSchema,
  teamMemberListQuerySchema,
  teamMemberUpdateSchema,
  type ContentId,
  type ContentSlug,
  type Paginated,
  type ReorderRequest,
  type TeamMemberCreateRequest,
  type TeamMemberItem,
  type TeamMemberListQuery,
  type TeamMemberUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { TeamMemberService } from '../application/services/team-member.service.js';

/**
 * RMQ entrypoints for the team-members collection (MS2). Thin — validate + delegate (U5). The
 * gateway makes list/get PUBLIC and guards create/update/delete with `content.manage` (MS4).
 */
@Controller()
export class TeamMemberMessageController {
  constructor(private readonly members: TeamMemberService) {}

  @MessagePattern(CONTENT_TEAM_MEMBER_LIST)
  list(
    @Payload(new ZodValidationPipe(teamMemberListQuerySchema))
    query: TeamMemberListQuery,
  ): Promise<Paginated<TeamMemberItem>> {
    return this.members.list(query);
  }

  @MessagePattern(CONTENT_TEAM_MEMBER_GET)
  get(
    @Payload(new ZodValidationPipe(contentSlugSchema)) payload: ContentSlug,
  ): Promise<TeamMemberItem> {
    return this.members.getBySlug(payload.slug);
  }

  @MessagePattern(CONTENT_TEAM_MEMBER_CREATE)
  create(
    @Payload(new ZodValidationPipe(teamMemberCreateSchema))
    body: TeamMemberCreateRequest,
  ): Promise<TeamMemberItem> {
    return this.members.create(body);
  }

  @MessagePattern(CONTENT_TEAM_MEMBER_UPDATE)
  update(
    @Payload(new ZodValidationPipe(teamMemberUpdateSchema))
    body: TeamMemberUpdateRequest,
  ): Promise<TeamMemberItem> {
    return this.members.update(body);
  }

  @MessagePattern(CONTENT_TEAM_MEMBER_REORDER)
  async reorder(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.members.reorder(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_TEAM_MEMBER_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.members.delete(payload.id);
  }
}
