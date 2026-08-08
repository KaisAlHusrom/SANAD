import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { DateTimeService, DrizzleTransactionRunner } from '@sanad/database';
import type { LeadCreatedEvent } from '@sanad/contracts';
import {
  notificationTable,
  processedMessageTable,
  schema,
  type NotificationsDb,
} from '../../db/schema/index.js';
import type { NotificationsEnv } from '../../env.js';
import { EmailProvider, type EmailMessage } from './email/email.provider.js';
import { LeadNotificationService } from '../application/services/index.js';
import {
  NotificationRepository,
  ProcessedMessageRepository,
} from './persistence/repositories/index.js';

// The dedicated test DB (TDD2) — created by infra/postgres/init/01-create-databases.sql.
const TEST_DB_URL =
  'postgresql://sanad:sanad@localhost:5440/notifications_test';
const TEAM_EMAIL = 'team@sanad.tech';

// Resolve the migrations dir from THIS file, not the CWD — vitest's cwd differs by how it is
// invoked, and a CWD-relative path made `migrate()` throw and the suite SILENTLY skip (false green).
const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    return pool;
  } catch {
    await pool.end().catch(() => undefined);
    return null;
  }
}

/** Records every email "sent" so the test can assert exactly-once dispatch. */
class FakeEmailProvider extends EmailProvider {
  readonly sent: EmailMessage[] = [];
  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}

function leadEvent(
  overrides: Partial<LeadCreatedEvent> = {},
): LeadCreatedEvent {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Layla',
    email: 'layla@example.com',
    company: 'Acme',
    projectType: 'saas',
    message: 'We need an LMS.',
    source: 'contact',
    locale: 'ar',
    occurredAt: '2026-06-24T00:00:00.000Z',
    ...overrides,
  };
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'notification_test unreachable — skipping notifications DB tests (TDD2).',
  );
}

describeDb(
  'lead.created → notifications (notification_test, P6 acceptance)',
  () => {
    const activePool = pool;
    if (!activePool) {
      return; // never reached (suite skipped) — narrows the type for TS
    }
    const db = drizzle(activePool, { schema }) as NotificationsDb;
    const clock = new DateTimeService();
    const runner = new DrizzleTransactionRunner(db);
    const processed = new ProcessedMessageRepository();
    const notifications = new NotificationRepository(db, clock);
    const env = { NOTIFICATIONS_TEAM_EMAIL: TEAM_EMAIL } as NotificationsEnv;

    function service(email: FakeEmailProvider): LeadNotificationService {
      return new LeadNotificationService(
        runner,
        processed,
        notifications,
        email,
        env,
      );
    }

    beforeEach(async () => {
      await activePool.query('truncate table notification');
      await activePool.query('truncate table processed_message');
    });

    it('creates 3 notices (in-app + team email + visitor ack) and sends 2 emails', async () => {
      const email = new FakeEmailProvider();
      await service(email).handleLeadCreated(leadEvent());

      const rows = await db.select().from(notificationTable);
      expect(rows).toHaveLength(3);

      const inApp = rows.filter((r) => r.channel === 'in_app');
      expect(inApp).toHaveLength(1);
      expect(inApp[0]).toMatchObject({
        recipientKind: 'role',
        recipient: 'admin',
        type: 'lead.created',
      });

      // Two emails dispatched exactly once: team alert + visitor acknowledgement.
      expect(email.sent).toHaveLength(2);
      const recipients = email.sent.map((m) => m.to).sort();
      expect(recipients).toEqual([TEAM_EMAIL, 'layla@example.com'].sort());

      // Both email rows are stamped sent.
      const emails = rows.filter((r) => r.channel === 'email');
      expect(emails.every((r) => r.emailStatus === 'sent')).toBe(true);
      expect(emails.every((r) => r.sentAt !== null)).toBe(true);

      // The idempotency ledger has exactly one claim.
      const ledger = await db.select().from(processedMessageTable);
      expect(ledger).toHaveLength(1);
    });

    it('is exactly-once on redelivery — no new rows, no new emails', async () => {
      const first = new FakeEmailProvider();
      await service(first).handleLeadCreated(leadEvent());
      expect(first.sent).toHaveLength(2);

      // Redeliver the SAME event (same id) — the claim conflicts, work is skipped.
      const second = new FakeEmailProvider();
      await service(second).handleLeadCreated(leadEvent());
      expect(second.sent).toHaveLength(0);

      const rows = await db.select().from(notificationTable);
      expect(rows).toHaveLength(3); // still 3 — not 6
      const ledger = await db.select().from(processedMessageTable);
      expect(ledger).toHaveLength(1);
    });

    it('sends the visitor acknowledgement in the lead locale (en)', async () => {
      const email = new FakeEmailProvider();
      await service(email).handleLeadCreated(
        leadEvent({ locale: 'en', email: 'sam@example.com' }),
      );
      const ack = email.sent.find((m) => m.to === 'sam@example.com');
      expect(ack?.subject).toContain('We received your request');
    });
  },
);
