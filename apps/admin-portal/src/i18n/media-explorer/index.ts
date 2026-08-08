import { registerCatalog } from '../register-catalog';
import ar from './ar.json';
import en from './en.json';

// App-shared catalog for the media explorer. It lives here rather than in `modules/media/i18n`
// because the SAME explorer renders inside the picker modal, which any form can open — a shared
// component may not depend on a feature module's catalog (W5/F13). Registered eagerly so the
// strings exist the moment a picker opens.
registerCatalog('mediaExplorer', ar, en);
