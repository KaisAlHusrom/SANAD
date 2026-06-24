import { z } from 'zod';
import { roleSchema } from './role.js';

/** Access vs refresh token discriminator. */
export const tokenTypeSchema = z.enum(['access', 'refresh']);
export type TokenType = z.infer<typeof tokenTypeSchema>;

/**
 * The signed ACCESS token body. Short-lived (minutes). Carries identity + the
 * resolved authorization claims so the gateway can authorize at the edge without a
 * round-trip (decision: permissions-in-token). `sub` is the user id.
 */
export const accessTokenPayloadSchema = z
  .object({
    sub: z.string().min(1),
    roles: z.array(roleSchema).min(1),
    permissions: z.array(z.string()),
    email: z.string().email().optional(),
    type: z.literal('access'),
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
  })
  .strict();

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

/**
 * The signed REFRESH token body. Long-lived but single-use: `jti` is the id of the
 * persisted (hashed) refresh-token row, so refresh can look it up, verify, and
 * rotate it (stateful refresh). Carries no authorization — those are re-resolved on
 * refresh and minted into the new access token.
 */
export const refreshTokenPayloadSchema = z
  .object({
    sub: z.string().min(1),
    jti: z.string().min(1),
    type: z.literal('refresh'),
    iat: z.number().int().optional(),
    exp: z.number().int().optional(),
  })
  .strict();

export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>;
