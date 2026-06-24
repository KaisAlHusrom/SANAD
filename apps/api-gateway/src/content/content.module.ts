import { Module } from '@nestjs/common';
import { BlogCategoryController } from './blog-category.controller.js';
import { BlogPostController } from './blog-post.controller.js';
import { BlogTagController } from './blog-tag.controller.js';
import { FaqController } from './faq.controller.js';
import { LeadsController } from './leads.controller.js';
import { MenuController } from './menu.controller.js';
import { PageController } from './page.controller.js';
import { PortfolioCategoryController } from './portfolio-category.controller.js';
import { PortfolioController } from './portfolio.controller.js';
import { ServiceController } from './service.controller.js';
import { TeamMemberController } from './team-member.controller.js';
import { TestimonialController } from './testimonial.controller.js';

/**
 * The content surface (CMS page-tree + services + testimonials + team + portfolio + blog +
 * faqs + menus + leads). Public website reads + guarded admin writes (MS4). Uses the global
 * CoreModule for the content RMQ client + token verifier.
 */
@Module({
  controllers: [
    PageController,
    ServiceController,
    TestimonialController,
    TeamMemberController,
    PortfolioCategoryController,
    PortfolioController,
    BlogCategoryController,
    BlogTagController,
    BlogPostController,
    FaqController,
    MenuController,
    LeadsController,
  ],
})
export class ContentModule {}
