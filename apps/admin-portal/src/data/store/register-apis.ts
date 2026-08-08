// Side-effect imports that register every feature api with the registry BEFORE the
// store is built (W3). Adding a module = add one import line here; the store config
// stays generic (it just reads getRegisteredApis()).
import '../../modules/auth/api/auth.api';
import '../../modules/integrations/api/integrations.api';
import '../../modules/settings/api/settings.api';
import '../branding/branding.api';
import '../../modules/services/api/services.api';
import '../../modules/testimonials/api/testimonials.api';
import '../../modules/faqs/api/faqs.api';
import '../../modules/team/api/team.api';
import '../../modules/portfolio/api/portfolio.api';
import '../../modules/portfolio/api/portfolio-categories.api';
import '../../modules/blog/api/blog.api';
import '../../modules/blog/api/blog-categories.api';
import '../../modules/blog/api/blog-tags.api';
import '../../modules/pages/api/pages.api';
import '../../modules/menus/api/menus.api';
import '../../modules/notifications/api/notifications.api';
import '../../modules/leads/api/leads.api';
import '../../modules/dashboard/api/dashboard.api';
import '../../modules/users/api/users.api';
import '../media-manage.api';
import '../lookups/media-lookup.api';
import '../lookups/folder-lookup.api';
import '../lookups/portfolio-category-lookup.api';
import '../lookups/blog-category-lookup.api';
import '../lookups/blog-tag-lookup.api';
import '../lookups/team-member-lookup.api';
import '../lookups/service-lookup.api';
import '../lookups/portfolio-lookup.api';
import '../lookups/testimonials-lookup.api';
import '../lookups/blog-lookup.api';
import '../lookups/faq-lookup.api';
