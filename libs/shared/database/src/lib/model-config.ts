/**
 * Per-model configuration consumed by the Base/Translatable repositories (N5).
 * `hidden` fields are stripped from API output; `fillable` whitelists writable
 * fields; `softDeletes` toggles soft-delete behavior.
 */
export interface ModelConfig<TEntity> {
  hidden: ReadonlyArray<keyof TEntity>;
  fillable: ReadonlyArray<keyof TEntity>;
  softDeletes: boolean;
}

/** Build a ModelConfig with sensible defaults for the unspecified parts. */
export function defineModelConfig<TEntity>(
  config: Partial<ModelConfig<TEntity>>,
): ModelConfig<TEntity> {
  return {
    hidden: config.hidden ?? [],
    fillable: config.fillable ?? [],
    softDeletes: config.softDeletes ?? false,
  };
}

/** Remove hidden fields from an entity before it leaves the service boundary. */
export function stripHidden<TEntity extends object>(
  entity: TEntity,
  config: ModelConfig<TEntity>,
): Partial<TEntity> {
  const output: Partial<TEntity> = { ...entity };
  for (const key of config.hidden) {
    delete output[key];
  }
  return output;
}

/** Keep only whitelisted (fillable) fields from a write payload. */
export function pickFillable<TEntity extends object>(
  input: Partial<TEntity>,
  config: ModelConfig<TEntity>,
): Partial<TEntity> {
  const output: Partial<TEntity> = {};
  for (const key of config.fillable) {
    if (key in input) {
      output[key] = input[key];
    }
  }
  return output;
}
