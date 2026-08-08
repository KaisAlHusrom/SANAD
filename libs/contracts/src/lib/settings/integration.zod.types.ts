import { z } from 'zod';
import {
  integrationCapabilitySchema,
  integrationProviderIdSchema,
} from './integration-catalog.js';

/**
 * Request/RMQ payloads for the integrations surface (MS2, N7 `.strict()`).
 *
 * `values` carries ONLY the fields the admin actually submitted: a key absent = leave the stored
 * value untouched (this is how a masked secret survives an edit that didn't retype it), and an
 * explicit `null` = clear the field. Values are strings regardless of the declared field type;
 * the settings-service stores them verbatim and each consumer coerces by the descriptor type.
 */
export const integrationValuesSchema = z.record(z.string().nullable());
export type IntegrationValues = z.infer<typeof integrationValuesSchema>;

/** `PUT /api/integrations/:capability/:provider` body (capability+provider are path params). */
export const integrationConfigureRequestSchema = z
  .object({ values: integrationValuesSchema })
  .strict();
export type IntegrationConfigureRequest = z.infer<
  typeof integrationConfigureRequestSchema
>;

/** The gateway-folded configure payload sent to the settings-service. */
export const integrationConfigurePayloadSchema = z
  .object({
    capability: integrationCapabilitySchema,
    provider: integrationProviderIdSchema,
    values: integrationValuesSchema,
  })
  .strict();
export type IntegrationConfigurePayload = z.infer<
  typeof integrationConfigurePayloadSchema
>;

/** `PUT /api/integrations/:capability/active` body. */
export const integrationActivateRequestSchema = z
  .object({ provider: integrationProviderIdSchema })
  .strict();
export type IntegrationActivateRequest = z.infer<
  typeof integrationActivateRequestSchema
>;

/** The gateway-folded activate payload. */
export const integrationActivatePayloadSchema = z
  .object({
    capability: integrationCapabilitySchema,
    provider: integrationProviderIdSchema,
  })
  .strict();
export type IntegrationActivatePayload = z.infer<
  typeof integrationActivatePayloadSchema
>;

/**
 * INTERNAL resolve (never exposed on the gateway, N13): omit `provider` to get the capability's
 * ACTIVE provider; pass one to resolve that specific provider (what a "Test connection" needs
 * before the provider is activated).
 */
export const integrationResolvePayloadSchema = z
  .object({
    capability: integrationCapabilitySchema,
    provider: integrationProviderIdSchema.optional(),
  })
  .strict();
export type IntegrationResolvePayload = z.infer<
  typeof integrationResolvePayloadSchema
>;

/** Test-connection payload, routed by the gateway to the service that OWNS the capability (MS1). */
export const integrationTestPayloadSchema = z
  .object({
    capability: integrationCapabilitySchema,
    provider: integrationProviderIdSchema,
  })
  .strict();
export type IntegrationTestPayload = z.infer<
  typeof integrationTestPayloadSchema
>;
