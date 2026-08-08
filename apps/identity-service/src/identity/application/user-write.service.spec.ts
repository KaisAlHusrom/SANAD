import 'reflect-metadata';
import type { RpcException } from '@nestjs/microservices';
import type { TransactionRunner } from '@sanad/database';
import { HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RbacRepository } from '../infrastructure/rbac.repository.js';
import type { UserRepository } from '../infrastructure/user.repository.js';
import type { PasswordHasher } from './password.hasher.js';
import { UserWriteService } from './user-write.service.js';

function statusOf(error: unknown): number {
  const payload = (error as RpcException).getError();
  return (payload as { statusCode: number }).statusCode;
}

function userRow(
  overrides: Partial<{
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  }> = {},
) {
  return {
    id: 'u1',
    email: 'new@sanad.tech',
    name: 'New User',
    password: 'hashed',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

let users: {
  findByEmail: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
let rbac: {
  findRoleByKey: ReturnType<typeof vi.fn>;
  assignRoleToUser: ReturnType<typeof vi.fn>;
  revokeRoleFromUser: ReturnType<typeof vi.fn>;
  getUserRoleKeys: ReturnType<typeof vi.fn>;
};
let hasher: { hash: ReturnType<typeof vi.fn> };
let tx: TransactionRunner;
let service: UserWriteService;

beforeEach(() => {
  users = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(userRow()),
    insert: vi.fn().mockResolvedValue(userRow()),
    update: vi
      .fn()
      .mockImplementation((id: string, patch: Record<string, unknown>) =>
        Promise.resolve(userRow({ id, ...patch })),
      ),
  };
  rbac = {
    findRoleByKey: vi.fn().mockResolvedValue({ id: 'role-admin' }),
    assignRoleToUser: vi.fn().mockResolvedValue(undefined),
    revokeRoleFromUser: vi.fn().mockResolvedValue(undefined),
    getUserRoleKeys: vi.fn().mockResolvedValue(['admin']),
  };
  hasher = { hash: vi.fn().mockResolvedValue('hashed-secret') };
  tx = {
    run: vi
      .fn()
      .mockImplementation((work: (exec: unknown) => Promise<unknown>) =>
        work({}),
      ),
  } as unknown as TransactionRunner;

  service = new UserWriteService(
    users as unknown as UserRepository,
    rbac as unknown as RbacRepository,
    hasher as unknown as PasswordHasher,
    tx,
  );
});

describe('UserWriteService', () => {
  it('creates a user: hashes the password and assigns roles in one transaction', async () => {
    const result = await service.create({
      email: 'new@sanad.tech',
      name: 'New User',
      password: 'supersecret',
      isActive: true,
      roles: ['admin'],
    });

    expect(hasher.hash).toHaveBeenCalledWith('supersecret');
    expect(tx.run).toHaveBeenCalledOnce();
    expect(users.insert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        password: 'hashed-secret',
        email: 'new@sanad.tech',
      }),
    );
    expect(rbac.assignRoleToUser).toHaveBeenCalledWith(
      'u1',
      'role-admin',
      expect.anything(),
    );
    expect(result).toMatchObject({
      id: 'u1',
      email: 'new@sanad.tech',
      roles: ['admin'],
    });
    expect(result).not.toHaveProperty('password');
  });

  it('rejects a duplicate email with 409', async () => {
    users.findByEmail.mockResolvedValue(userRow({ id: 'existing' }));
    const error = await service
      .create({
        email: 'new@sanad.tech',
        name: 'X',
        password: 'supersecret',
        isActive: true,
        roles: [],
      })
      .catch((e: unknown) => e);
    expect(statusOf(error)).toBe(HttpStatus.CONFLICT);
    expect(users.insert).not.toHaveBeenCalled();
  });

  it('updates a user profile', async () => {
    const result = await service.update({ id: 'u1', name: 'Renamed' });
    expect(users.update).toHaveBeenCalledWith('u1', { name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('rejects an update for a missing user with 404', async () => {
    users.findById.mockResolvedValue(null);
    const error = await service
      .update({ id: 'gone', name: 'X' })
      .catch((e: unknown) => e);
    expect(statusOf(error)).toBe(HttpStatus.NOT_FOUND);
  });

  it('rejects an email change colliding with another user (409)', async () => {
    users.findById.mockResolvedValue(
      userRow({ id: 'u1', email: 'old@sanad.tech' }),
    );
    users.findByEmail.mockResolvedValue(
      userRow({ id: 'other', email: 'taken@sanad.tech' }),
    );
    const error = await service
      .update({ id: 'u1', email: 'taken@sanad.tech' })
      .catch((e: unknown) => e);
    expect(statusOf(error)).toBe(HttpStatus.CONFLICT);
  });

  it('assigns a role and returns the updated user', async () => {
    const result = await service.assignRole({
      userId: 'u1',
      role: 'developer',
    });
    expect(rbac.assignRoleToUser).toHaveBeenCalledWith('u1', 'role-admin');
    expect(result.roles).toEqual(['admin']);
  });

  it('revokes a role', async () => {
    await service.revokeRole({ userId: 'u1', role: 'developer' });
    expect(rbac.revokeRoleFromUser).toHaveBeenCalledWith('u1', 'role-admin');
  });

  it('rejects a role change for a missing user with 404', async () => {
    users.findById.mockResolvedValue(null);
    const error = await service
      .assignRole({ userId: 'gone', role: 'developer' })
      .catch((e: unknown) => e);
    expect(statusOf(error)).toBe(HttpStatus.NOT_FOUND);
  });
});
