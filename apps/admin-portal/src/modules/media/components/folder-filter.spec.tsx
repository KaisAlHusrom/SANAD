import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MediaFolder } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '../../../i18n';
import '../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { FolderFilter } from './folder-filter';

const folders: MediaFolder[] = [
  {
    id: 'fold-1',
    parentId: null,
    name: 'Logos',
    createdAt: 'x',
    updatedAt: 'x',
  },
  {
    id: 'fold-2',
    parentId: null,
    name: 'Banners',
    createdAt: 'x',
    updatedAt: 'x',
  },
];

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: folders }),
      ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FolderFilter (ServerSelect over the folder lookup — W5 acceptance)', () => {
  it('lists folders from the lookup api and emits the chosen id', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<FolderFilter value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: 'All folders' }));
    await user.click(await screen.findByText('Logos'));

    expect(onChange).toHaveBeenCalledWith('fold-1');
  });
});
