import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import { IDENTITY_ENV, type IdentityEnv } from '../env.js';
import {
  userRoleTable,
  userTable,
  type IdentityDb,
} from '../db/schema/index.js';
import { RbacRepository } from '../identity/infrastructure/rbac.repository.js';
import { UserRepository } from '../identity/infrastructure/user.repository.js';
import { PasswordHasher } from '../identity/application/password.hasher.js';
import { PERMISSION_CATALOG, ROLE_CATALOG } from './seed-data.js';

/**
 * Idempotent seed (decision 3): the role/permission catalog + one env-configured
 * admin, so login works end-to-end immediately and re-running is safe. Runs on
 * bootstrap. Creating the admin enqueues `user.registered` in the SAME transaction
 * (transactional Outbox, MS3) — no consumer yet (notifications is P6).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: IdentityDb,
    @Inject(IDENTITY_ENV) private readonly env: IdentityEnv,
    private readonly clock: DateTimeService,
    private readonly hasher: PasswordHasher,
    private readonly rbac: RbacRepository,
    private readonly users: UserRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedRbac();
    await this.seedAdmin();
  }

  private async seedRbac(): Promise<void> {
    const permissionIds = new Map<string, string>();
    for (const [key, description] of PERMISSION_CATALOG) {
      permissionIds.set(
        key,
        await this.rbac.ensurePermission(key, description),
      );
    }
    for (const role of ROLE_CATALOG) {
      const roleId = await this.rbac.ensureRole(
        role.key,
        role.name,
        role.description,
      );
      for (const permissionKey of role.permissions) {
        const permissionId = permissionIds.get(permissionKey);
        if (permissionId) {
          await this.rbac.attachPermissionToRole(roleId, permissionId);
        }
      }
    }
  }

  private async seedAdmin(): Promise<void> {
    const existing = await this.users.findByEmailWithSecret(
      this.env.ADMIN_EMAIL,
    );
    if (existing) {
      return;
    }
    const adminRole = await this.rbac.findRoleByKey('admin');
    if (!adminRole) {
      throw new Error('admin role missing after RBAC seed');
    }
    const password = await this.hasher.hash(this.env.ADMIN_PASSWORD);

    await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(userTable)
        .values({
          email: this.env.ADMIN_EMAIL,
          password,
          name: 'Administrator',
          isActive: true,
        })
        .returning();
      const user = inserted[0];
      if (!user) {
        throw new Error('admin insert returned no row');
      }
      await tx
        .insert(userRoleTable)
        .values({ userId: user.id, roleId: adminRole.id });

      const outbox = new DrizzleOutboxStore(tx, this.clock);
      await outbox.enqueue(
        createOutboxRecord(
          'user.registered',
          { userId: user.id, email: user.email },
          this.clock.nowIso(),
        ),
      );
    });

    this.logger.log(`Seeded admin user ${this.env.ADMIN_EMAIL}`);
  }
}
