import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuditModule } from '@sanad/audit';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import {
  commandsQueue,
  createRmqClientOptions,
  eventsQueue,
} from '@sanad/messaging';
import { schema } from './db/schema/index.js';
import { SETTINGS_CLIENT } from './core/injection-tokens.js';
import { CONTENT_ENV, loadContentEnv } from './env.js';
import { HealthController } from './health/health.controller.js';
import { LeadDedupSettingsResolver } from './content/application/resolvers/index.js';
import { LeadService } from './content/application/services/lead/lead.service.js';
import { MediaReconcileService } from './content/application/services/media-reconcile.service.js';
import { BlogCategoryService } from './content/application/services/blog-category.service.js';
import { BlogPostService } from './content/application/services/blog-post.service.js';
import { BlogTagService } from './content/application/services/blog-tag.service.js';
import { FaqService } from './content/application/services/faq.service.js';
import { MenuService } from './content/application/services/menu.service.js';
import { PortfolioCategoryService } from './content/application/services/portfolio-category.service.js';
import { PortfolioProjectService } from './content/application/services/portfolio-project.service.js';
import { CollectionHydrationService } from './content/application/services/collection-hydration.service.js';
import { PageService } from './content/application/services/page.service.js';
import { ServiceService } from './content/application/services/service.service.js';
import { TeamMemberService } from './content/application/services/team-member.service.js';
import { TestimonialService } from './content/application/services/testimonial.service.js';
import { MediaDeletedConsumer } from './content/infrastructure/consumers/media-deleted.consumer.js';
import { BlockRepository } from './content/infrastructure/persistence/repositories/block.repository.js';
import { BlogCategoryRepository } from './content/infrastructure/persistence/repositories/blog-category.repository.js';
import { BlogPostTagRepository } from './content/infrastructure/persistence/repositories/blog-post-tag.repository.js';
import { BlogPostRepository } from './content/infrastructure/persistence/repositories/blog-post.repository.js';
import { BlogTagRepository } from './content/infrastructure/persistence/repositories/blog-tag.repository.js';
import { FaqRepository } from './content/infrastructure/persistence/repositories/faq.repository.js';
import { LeadRepository } from './content/infrastructure/persistence/repositories/lead.repository.js';
import { MenuItemRepository } from './content/infrastructure/persistence/repositories/menu-item.repository.js';
import { MenuRepository } from './content/infrastructure/persistence/repositories/menu.repository.js';
import { PortfolioCategoryRepository } from './content/infrastructure/persistence/repositories/portfolio-category.repository.js';
import { PortfolioProjectRepository } from './content/infrastructure/persistence/repositories/portfolio-project.repository.js';
import { PageRepository } from './content/infrastructure/persistence/repositories/page.repository.js';
import { ProcessedMessageRepository } from './content/infrastructure/persistence/repositories/processed-message.repository.js';
import { SectionRepository } from './content/infrastructure/persistence/repositories/section.repository.js';
import { ServiceRepository } from './content/infrastructure/persistence/repositories/service.repository.js';
import { TeamMemberRepository } from './content/infrastructure/persistence/repositories/team-member.repository.js';
import { TestimonialRepository } from './content/infrastructure/persistence/repositories/testimonial.repository.js';
import { BlogCategoryMessageController } from './content/presentation/blog-category.message-controller.js';
import { BlogPostMessageController } from './content/presentation/blog-post.message-controller.js';
import { BlogTagMessageController } from './content/presentation/blog-tag.message-controller.js';
import { FaqMessageController } from './content/presentation/faq.message-controller.js';
import { LeadMessageController } from './content/presentation/lead.message-controller.js';
import { MenuMessageController } from './content/presentation/menu.message-controller.js';
import { PortfolioCategoryMessageController } from './content/presentation/portfolio-category.message-controller.js';
import { PortfolioProjectMessageController } from './content/presentation/portfolio-project.message-controller.js';
import { PageMessageController } from './content/presentation/page.message-controller.js';
import { ServiceMessageController } from './content/presentation/service.message-controller.js';
import { TeamMemberMessageController } from './content/presentation/team-member.message-controller.js';
import { TestimonialMessageController } from './content/presentation/testimonial.message-controller.js';
import {
  CONTENT_EVENTS_CLIENT,
  OutboxRelayService,
} from './outbox/outbox-relay.service.js';
import { SeedService } from './seed/seed.service.js';

// Read + validate env once at module load (U19); used for DB/broker wiring.
const env = loadContentEnv();

/**
 * The content service root. Wires its own DB (DrizzleModule, MS5), the events ClientProxy
 * for the Outbox relay (`lead.created`, MS3), the Page→Section→Block/service/lead surfaces,
 * the health endpoint, and the idempotent `media.deleted` consumer (MS6). RMQ command +
 * event handling is connected in `main.ts` (hybrid app).
 */
@Module({
  imports: [
    DrizzleModule.forRoot({ connectionString: env.DATABASE_URL, schema }),
    // After DrizzleModule: the audit interceptor resolves the DRIZZLE handle to flush with,
    // and `auditLogTable` is mounted in this service's own schema (P8.8, MS5).
    AuditModule.forRoot(),
    ClientsModule.register([
      {
        name: CONTENT_EVENTS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: eventsQueue('content'),
        }),
      },
      {
        // Request/reply to settings (MS2) — the lead duplicate window. The COMMANDS queue,
        // not the events one: this is a question expecting an answer.
        name: SETTINGS_CLIENT,
        ...createRmqClientOptions({
          url: env.RABBITMQ_URL,
          queue: commandsQueue('settings'),
        }),
      },
    ]),
  ],
  controllers: [
    PageMessageController,
    ServiceMessageController,
    TestimonialMessageController,
    TeamMemberMessageController,
    PortfolioCategoryMessageController,
    PortfolioProjectMessageController,
    BlogCategoryMessageController,
    BlogTagMessageController,
    BlogPostMessageController,
    FaqMessageController,
    MenuMessageController,
    LeadMessageController,
    MediaDeletedConsumer,
    HealthController,
  ],
  providers: [
    { provide: CONTENT_ENV, useValue: env },
    { provide: DateTimeService, useFactory: () => new DateTimeService() },
    PageRepository,
    SectionRepository,
    BlockRepository,
    ServiceRepository,
    TestimonialRepository,
    TeamMemberRepository,
    PortfolioCategoryRepository,
    PortfolioProjectRepository,
    BlogCategoryRepository,
    BlogTagRepository,
    BlogPostRepository,
    BlogPostTagRepository,
    FaqRepository,
    MenuRepository,
    MenuItemRepository,
    LeadRepository,
    ProcessedMessageRepository,
    PageService,
    ServiceService,
    CollectionHydrationService,
    TestimonialService,
    TeamMemberService,
    PortfolioCategoryService,
    PortfolioProjectService,
    BlogCategoryService,
    BlogTagService,
    BlogPostService,
    FaqService,
    MenuService,
    LeadDedupSettingsResolver,
    LeadService,
    MediaReconcileService,
    OutboxRelayService,
    SeedService,
  ],
})
export class AppModule {}
