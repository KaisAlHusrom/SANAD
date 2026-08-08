import {
  getProviderDescriptor,
  type IntegrationCapability,
  type IntegrationFieldDescriptor,
  type IntegrationFieldStatus,
  type IntegrationProviderId,
  type IntegrationProviderStatus,
  type IntegrationValues,
} from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { FieldConfig, FieldType } from '../../../components/dynamic-form';
import { useConfigureProviderMutation } from '../api/integrations.api';

/** A provider field's value in the form — coerced to a string on submit (the API takes strings). */
type FormValue = string | number | boolean | undefined;
export type ProviderFormValues = Record<string, FormValue>;

/** Map a catalog field type onto the dynamic-form kit's field type (F9 — reuse the kit). */
function toFieldType(descriptor: IntegrationFieldDescriptor): FieldType {
  switch (descriptor.type) {
    case 'password':
      return 'password';
    case 'number':
      return 'number';
    case 'boolean':
      return 'toggle';
    case 'email':
      return 'email';
    default:
      return 'text';
  }
}

/**
 * Build the form fields from the provider descriptor — so a NEW provider needs zero new form
 * code. A configured secret shows `••••last4` as its placeholder and starts blank: leaving it
 * blank keeps the stored value (the API treats an absent key as "untouched").
 */
function toFields(
  descriptors: readonly IntegrationFieldDescriptor[],
  statusByKey: Map<string, IntegrationFieldStatus>,
  provider: IntegrationProviderId,
  t: TFunction<'integrations'>,
): FieldConfig<ProviderFormValues>[] {
  return descriptors.map((descriptor) => {
    const status = statusByKey.get(descriptor.key);
    const masked = descriptor.secret && status?.isSet ? status.last4 : null;
    return {
      name: descriptor.key,
      type: toFieldType(descriptor),
      label: t(`field.${provider}.${descriptor.key}`, {
        defaultValue: descriptor.key,
      }),
      placeholder: masked ? `••••${masked}` : undefined,
      colSpan: 2,
    };
  });
}

/**
 * The zod schema mirrors the descriptor: a required field must be filled, EXCEPT a secret that
 * is already stored (blank = keep it). Booleans/numbers stay loose — the kit gives us the right
 * primitive and we stringify on submit.
 */
function toSchema(
  descriptors: readonly IntegrationFieldDescriptor[],
  statusByKey: Map<string, IntegrationFieldStatus>,
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const descriptor of descriptors) {
    const alreadySet = statusByKey.get(descriptor.key)?.isSet ?? false;
    if (descriptor.type === 'boolean') {
      shape[descriptor.key] = z.union([z.boolean(), z.string()]).optional();
      continue;
    }
    const mustFill = descriptor.required && !(descriptor.secret && alreadySet);
    const base = z.union([z.string(), z.number()]).optional();
    shape[descriptor.key] = mustFill
      ? base.refine(
          (value) => value !== undefined && String(value).trim() !== '',
          { message: 'required' },
        )
      : base;
  }
  return z.object(shape);
}

/** Prefill: non-secret values are shown (owner can SEE their bucket); secrets start blank. */
function toDefaults(
  descriptors: readonly IntegrationFieldDescriptor[],
  statusByKey: Map<string, IntegrationFieldStatus>,
): ProviderFormValues {
  const values: ProviderFormValues = {};
  for (const descriptor of descriptors) {
    const status = statusByKey.get(descriptor.key);
    if (descriptor.secret) {
      values[descriptor.key] = '';
    } else if (descriptor.type === 'boolean') {
      values[descriptor.key] = status?.value === 'true';
    } else {
      values[descriptor.key] = status?.value ?? '';
    }
  }
  return values;
}

/**
 * Turn the submitted form into the API payload. A blank SECRET is omitted (keep the stored
 * value); everything else is sent as a string, with a blank non-secret meaning "clear it".
 */
export function toSubmitValues(
  descriptors: readonly IntegrationFieldDescriptor[],
  values: ProviderFormValues,
): IntegrationValues {
  const payload: IntegrationValues = {};
  for (const descriptor of descriptors) {
    const raw = values[descriptor.key];
    const asString = raw === undefined ? '' : String(raw);
    if (descriptor.secret && asString.trim() === '') {
      continue; // untouched — leave the stored secret alone
    }
    payload[descriptor.key] = asString;
  }
  return payload;
}

interface UseProviderConfigArgs {
  capability: IntegrationCapability;
  provider: IntegrationProviderId;
  status?: IntegrationProviderStatus;
}

interface UseProviderConfigResult {
  fields: FieldConfig<ProviderFormValues>[];
  schema: z.ZodType<ProviderFormValues>;
  defaults: ProviderFormValues;
  submit: (values: ProviderFormValues) => Promise<unknown>;
  isSaving: boolean;
}

/**
 * Provider-configuration form logic (U5/F9): derives the fields, the validation schema and the
 * prefill entirely from the shared catalog descriptor, then submits through the integrations api.
 * Adding a provider to the catalog gives it a working form with no UI change.
 */
export function useProviderConfig({
  capability,
  provider,
  status,
}: UseProviderConfigArgs): UseProviderConfigResult {
  const { t } = useTranslation('integrations');
  const [configureProvider, { isLoading }] = useConfigureProviderMutation();

  const descriptors = getProviderDescriptor(capability, provider)?.fields ?? [];
  const statusByKey = new Map(
    (status?.fields ?? []).map((field) => [field.key, field]),
  );

  return {
    fields: toFields(descriptors, statusByKey, provider, t),
    schema: toSchema(descriptors, statusByKey) as z.ZodType<ProviderFormValues>,
    defaults: toDefaults(descriptors, statusByKey),
    submit: (values) =>
      configureProvider({
        capability,
        provider,
        values: toSubmitValues(descriptors, values),
      }).unwrap(),
    isSaving: isLoading,
  };
}
