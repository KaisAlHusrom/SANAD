import { afterEach, describe, expect, it } from 'vitest';
import { clearModals, findModal, registerModal } from './modal-registry';

afterEach(() => {
  clearModals();
});

describe('modal registry', () => {
  it('registers a component for one or more types', () => {
    const entry = { component: () => null, types: ['addX', 'editX'] };
    registerModal(entry);
    expect(findModal('addX')).toBe(entry);
    expect(findModal('editX')).toBe(entry);
  });

  it('returns undefined for an unregistered type', () => {
    expect(findModal('nope')).toBeUndefined();
  });

  it('clears all entries', () => {
    registerModal({ component: () => null, types: ['x'] });
    clearModals();
    expect(findModal('x')).toBeUndefined();
  });
});
