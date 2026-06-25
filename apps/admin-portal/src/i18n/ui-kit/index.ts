import { registerCatalog } from '../register-catalog';
import ar from './ar.json';
import en from './en.json';

// App-shared catalog for the reusable UI kit (ServerSelect / DataTable / DynamicForm).
// Registered eagerly alongside `common` so its strings exist before the first render.
registerCatalog('uiKit', ar, en);
