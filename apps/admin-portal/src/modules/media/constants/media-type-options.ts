/** A MIME-prefix filter option for the media library; `value` undefined = no filter. */
export interface MediaTypeOption {
  value: string | undefined;
  labelKey: string;
}

export const MEDIA_TYPE_OPTIONS: readonly MediaTypeOption[] = [
  { value: undefined, labelKey: 'types.all' },
  { value: 'image', labelKey: 'types.image' },
  { value: 'video', labelKey: 'types.video' },
  { value: 'audio', labelKey: 'types.audio' },
  { value: 'application', labelKey: 'types.document' },
];
