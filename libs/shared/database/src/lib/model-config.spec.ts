import { describe, expect, it } from 'vitest';
import {
  defineModelConfig,
  pickFillable,
  stripHidden,
} from './model-config.js';

interface User {
  id: string;
  email: string;
  passwordHash: string;
}

describe('model-config', () => {
  const config = defineModelConfig<User>({
    hidden: ['passwordHash'],
    fillable: ['email'],
  });

  it('strips hidden fields from output', () => {
    const out = stripHidden(
      { id: '1', email: 'a@b.com', passwordHash: 'secret' },
      config,
    );
    expect(out).toEqual({ id: '1', email: 'a@b.com' });
    expect('passwordHash' in out).toBe(false);
  });

  it('keeps only fillable fields on write', () => {
    const out = pickFillable(
      { email: 'a@b.com', passwordHash: 'hacked', id: 'x' },
      config,
    );
    expect(out).toEqual({ email: 'a@b.com' });
  });

  it('defaults unspecified parts', () => {
    const empty = defineModelConfig<User>({});
    expect(empty.softDeletes).toBe(false);
    expect(empty.hidden).toEqual([]);
  });
});
