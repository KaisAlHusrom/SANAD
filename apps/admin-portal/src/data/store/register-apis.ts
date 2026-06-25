// Side-effect imports that register every feature api with the registry BEFORE the
// store is built (W3). Adding a module = add one import line here; the store config
// stays generic (it just reads getRegisteredApis()).
import '../../modules/auth/api/auth.api';
import '../../modules/integration-secrets/api/integration-secrets.api';
import '../../modules/media/api/media.api';
import '../../modules/settings/api/settings.api';
import '../lookups/media-lookup.api';
import '../lookups/folder-lookup.api';
