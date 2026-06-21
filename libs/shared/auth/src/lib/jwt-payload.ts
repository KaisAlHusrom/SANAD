import { z } from 'zod';
import { roleSchema } from './role.js';

/** Access vs refresh token discriminator. */
export const tokenTypeSchema = z.enum(['access', 'refresh']);
export type TokenType = z.infer<typeof tokenTypeSchema>;

/** The signed JWT body. `sub` is the user id; `roles` drives RBAC. */
export const jwtPayloadSchema = z
  .object({
    sub: z.string().min(1),
    roles: z.array(roleSchema).min(1),
    type: tokenTypeSchema,
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
  })
  .strict();

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
