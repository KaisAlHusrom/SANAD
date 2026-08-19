/**
 * The append-only guard, enforced by the DATABASE rather than by convention.
 *
 * "Rows are never updated, deleted or truncated away" is a property evidence must actually have,
 * not one a reviewer has to take on trust: the store exposes no update or delete, and these two
 * triggers make the rule hold even for a `psql` session, a future migration, or code that bypasses
 * the store. Both are needed — a row trigger never fires for TRUNCATE.
 * Written as idempotent DDL (`create or replace` + `drop … if exists`) so re-applying it in
 * another service's migration is safe.
 *
 * drizzle-kit cannot generate a trigger from a table definition, so this constant is the single
 * source (U3): the lib's own migration applies it, and an adopting service applies the same
 * string in a `drizzle-kit generate --custom` migration.
 */
export const AUDIT_IMMUTABILITY_SQL = `
create or replace function sanad_audit_log_immutable() returns trigger as $$
begin
  raise exception 'audit_log is append-only: % is not permitted', tg_op
    using errcode = 'restrict_violation';
end;
$$ language plpgsql;

drop trigger if exists audit_log_immutable on audit_log;

create trigger audit_log_immutable
  before update or delete on audit_log
  for each row execute function sanad_audit_log_immutable();

drop trigger if exists audit_log_no_truncate on audit_log;

create trigger audit_log_no_truncate
  before truncate on audit_log
  for each statement execute function sanad_audit_log_immutable();
`;

/**
 * The row-level guard covers UPDATE and DELETE; TRUNCATE is a statement-level operation that
 * bypasses row triggers completely, so without {@link AUDIT_IMMUTABILITY_TRUNCATE_TRIGGER} the
 * entire trail stays erasable by a single statement. Named so a test DB can disable exactly this
 * one to reset itself (TDD2) without touching the row guard.
 */
export const AUDIT_IMMUTABILITY_TRUNCATE_TRIGGER = 'audit_log_no_truncate';

/**
 * Resetting an audit table is legitimate in a `*_test` database and nowhere else, so the one
 * sanctioned way to do it lives here rather than being re-improvised per spec: drop the truncate
 * guard, truncate, put it back. The row guard stays armed throughout.
 */
export const auditTestResetSql = (table = 'audit_log'): string => `
alter table "${table}" disable trigger ${AUDIT_IMMUTABILITY_TRUNCATE_TRIGGER};
truncate table "${table}";
alter table "${table}" enable trigger ${AUDIT_IMMUTABILITY_TRUNCATE_TRIGGER};
`;

/** The SQLSTATE the trigger raises with, so a caller can recognise it without string matching. */
export const AUDIT_IMMUTABILITY_ERROR_CODE = '23001';
