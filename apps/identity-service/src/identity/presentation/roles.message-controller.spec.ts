import 'reflect-metadata';
import type { RoleSummary } from '@sanad/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { UserReadService } from '../application/user-read.service.js';
import { RolesMessageController } from './roles.message-controller.js';

describe('RolesMessageController', () => {
  it('returns the role catalog', async () => {
    const roles: RoleSummary[] = [
      { key: 'admin', name: 'Admin', description: 'Full access' },
    ];
    const reader = {
      listRoles: vi.fn().mockResolvedValue(roles),
    } as unknown as UserReadService;

    const controller = new RolesMessageController(reader);
    await expect(controller.list()).resolves.toEqual(roles);
  });
});
