import { z } from 'zod';

/**
 * The `user.registered` event payload (MS3 Outbox). Zod-first (U16) so the consumer
 * runtime-validates the inbound broker message. Carries enough to greet the user by name in
 * their own locale without a follow-up read (U24).
 */
export const userRegisteredEventSchema = z
  .object({
    userId: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1),
  })
  .strict();

export type UserRegisteredEvent = z.infer<typeof userRegisteredEventSchema>;
