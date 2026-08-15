/**
 * The append-only guard, enforced by the DATABASE rather than by convention.
 *
 * "Rows are never updated or deleted" is a property evidence must actually have, not one a
 * reviewer has to take on trust: the store exposes no update or delete, and this trigger makes
 * the rule hold even for a `psql` session, a future migration, or code that bypasses the store.
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
`;

/** The SQLSTATE the trigger raises with, so a caller can recognise it without string matching. */
export const AUDIT_IMMUTABILITY_ERROR_CODE = '23001';
