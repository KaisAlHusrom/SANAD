-- P8.8: make `audit_log` append-only in the DATABASE, not merely by convention.
-- Body kept identical to `AUDIT_IMMUTABILITY_SQL` in `@sanad/audit` (U3 — that constant is the
-- single source; drizzle-kit cannot generate a trigger, so every adopting service applies it in
-- a `--custom` migration like this one). Idempotent, so re-applying is safe.

create or replace function sanad_audit_log_immutable() returns trigger as $$
begin
  raise exception 'audit_log is append-only: % is not permitted', tg_op
    using errcode = 'restrict_violation';
end;
$$ language plpgsql;
--> statement-breakpoint
drop trigger if exists audit_log_immutable on audit_log;
--> statement-breakpoint
create trigger audit_log_immutable
  before update or delete on audit_log
  for each row execute function sanad_audit_log_immutable();
