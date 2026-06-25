import { z } from 'zod';
import { booleanParamSchema } from '../common/boolean-param.js';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The in-app notifications list query (P7). Extends the shared paginated list query (U17)
 * with a whitelisted `unread` filter (N7 strict boolean — never `z.coerce.boolean`) so the
 * bell can show only unread. Recipient scoping comes from the forwarded identity, NOT the
 * query (a client can never request another audience's notices). Strict.
 */
export const notificationListQuerySchema = listQuerySchema
  .extend({
    unread: booleanParamSchema.optional(),
  })
  .strict();

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
