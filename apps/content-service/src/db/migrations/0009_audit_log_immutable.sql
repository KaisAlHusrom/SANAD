-- P8.10.B2: content-service adopts the shared audit trail, so it must adopt its append-only
-- guard too. Body kept identical to `AUDIT_IMMUTABILITY_SQL` in `@sanad/audit` (U3 — that
-- constant is the single source; drizzle-kit cannot generate a trigger, so every adopting
-- service applies it in a `--custom` migration like this one). Both guards are required: a
-- `for each row` trigger never fires for TRUNCATE, which would leave the whole trail erasable
-- by one statement. Idempotent, so re-applying is safe.

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
--> statement-breakpoint
drop trigger if exists audit_log_no_truncate on audit_log;
--> statement-breakpoint
create trigger audit_log_no_truncate
  before truncate on audit_log
  for each statement execute function sanad_audit_log_immutable();
--> statement-breakpoint
-- `0008` added `last_submitted_at` with `default now()`, which Postgres writes into every
-- EXISTING row — telling the new duplicate window that every historical lead was submitted at
-- migration time. Their real last submission is the only one they have: `created_at`.
update "lead" set "last_submitted_at" = "created_at" where "last_submitted_at" <> "created_at";
