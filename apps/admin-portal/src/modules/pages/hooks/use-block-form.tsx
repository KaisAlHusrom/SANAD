import {
  type BlockNode,
  type BlockType,
  type BlockUpsertRequest,
  type LocalizedText,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { MediaIdPickerField } from '../../../components/media-picker';
import { RichTextEditor } from '../../../components/rich-text';
import { useUpsertBlockMutation } from '../api/pages.api';
import {
  BLOCK_BODY,
  BLOCK_DATA_KEYS,
  BLOCK_HAS_IMAGE,
  CTA_VARIANTS,
  blockFormSchema,
  fromBlockData,
  toBlockData,
  type BlockFormValues,
} from '../schema';

const BLOCK_TRANSLATABLE_KEYS = ['title', 'body'] as const;

export interface UseBlockFormArgs {
  pageId: string;
  sectionId: string;
  type: BlockType;
  /** Present → edit; absent → create at `nextSortOrder`. */
  node?: BlockNode;
  nextSortOrder: number;
}

export interface UseBlockFormResult {
  fields: FieldConfig<BlockFormValues>[];
  schema: ReturnType<typeof blockFormSchema>;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: BlockFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * The typed per-block-type editor (U21 owner decision): the kind's translatable title/body
 * (body = a Quill rich-text for `richtext`, a textarea for `text`/`step`/`feature`, hidden for
 * `stat`/`image`/`cta`), an optional media picker, and the kind's typed `data` fields (stat →
 * value/suffix, cta → href/variant, step/feature → icon). The submit pivots translations +
 * collects the `data` object (`toBlockData`).
 */
export function useBlockForm(args: UseBlockFormArgs): UseBlockFormResult {
  const { pageId, sectionId, type, node, nextSortOrder } = args;
  const { t } = useTranslation('pages');
  const [upsertBlock] = useUpsertBlockMutation();
  const mode: FormMode = node ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<BlockFormValues>[]>(() => {
    const list: FieldConfig<BlockFormValues>[] = [
      {
        name: 'title',
        type: 'text',
        label: t('block.title'),
        translatable: true,
        colSpan: 4,
      },
    ];

    const dataKeys = BLOCK_DATA_KEYS[type];
    if (dataKeys.includes('value')) {
      list.push({
        name: 'value',
        type: 'number',
        label: t('block.value'),
        colSpan: 2,
        defaultValue: 0,
      });
    }
    if (dataKeys.includes('suffix')) {
      list.push({
        name: 'suffix',
        type: 'text',
        label: t('block.suffix'),
        placeholder: t('block.suffixPlaceholder'),
        colSpan: 2,
      });
    }
    if (dataKeys.includes('icon')) {
      list.push({
        name: 'icon',
        type: 'text',
        label: t('block.icon'),
        placeholder: t('block.iconPlaceholder'),
        colSpan: 2,
      });
    }
    if (dataKeys.includes('href')) {
      list.push({
        name: 'href',
        type: 'text',
        label: t('block.href'),
        placeholder: t('block.hrefPlaceholder'),
        colSpan: 2,
      });
    }
    if (dataKeys.includes('variant')) {
      list.push({
        name: 'variant',
        type: 'select',
        label: t('block.variant'),
        colSpan: 2,
        defaultValue: 'primary',
        options: CTA_VARIANTS.map((value) => ({
          value,
          label: t(`blockVariants.${value}`),
        })),
      });
    }

    if (BLOCK_HAS_IMAGE[type]) {
      list.push({
        name: 'imageMediaId',
        type: 'custom',
        label: t('block.image'),
        colSpan: 4,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <MediaIdPickerField
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
              />
            )}
          />
        ),
      });
    }

    const body = BLOCK_BODY[type];
    if (body === 'richtext') {
      list.push({
        name: 'body',
        type: 'custom',
        label: t('block.body'),
        translatable: true,
        colSpan: 4,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <RichTextEditor
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
                aria-label={t('block.body')}
              />
            )}
          />
        ),
      });
    } else if (body === 'textarea') {
      list.push({
        name: 'body',
        type: 'textarea',
        label: t('block.body'),
        translatable: true,
        colSpan: 4,
        rows: 4,
      });
    }

    return list;
  }, [t, type]);

  const record = useMemo(
    () =>
      node
        ? {
            ...toLocalizedFormRecord(node, BLOCK_TRANSLATABLE_KEYS),
            imageMediaId: node.imageMediaId ?? '',
            ...fromBlockData(node),
          }
        : undefined,
    [node],
  );

  const submit = async (values: BlockFormValues): Promise<unknown> => {
    const pivoted = toLocalizedUpsertBody<{
      title: LocalizedText;
      body: LocalizedText;
    }>(values as unknown as Record<string, unknown>, {
      translatableKeys: BLOCK_TRANSLATABLE_KEYS,
    });
    const body: BlockUpsertRequest = {
      ...(node ? { id: node.id } : {}),
      sectionId,
      type,
      sortOrder: node ? node.sortOrder : nextSortOrder,
      data: toBlockData(type, values as unknown as Record<string, unknown>),
      imageMediaId: values.imageMediaId ? values.imageMediaId : null,
      title: pivoted.title,
      body: pivoted.body,
    };
    return upsertBlock({ body, pageId }).unwrap();
  };

  return {
    fields,
    schema: blockFormSchema(type),
    mode,
    record,
    submit,
    title: node ? t('block.editTitle') : t('block.createTitle'),
    successMessage: node ? t('block.updated') : t('block.created'),
  };
}
