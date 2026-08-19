-- P8.8 follow-up: close the TRUNCATE hole in the append-only guard.
-- A `for each row` trigger never fires for TRUNCATE, so `0004` left the whole trail erasable by a
-- single statement — which is not what "append-only" means to anything relying on it as evidence.
-- Body kept identical to `AUDIT_IMMUTABILITY_SQL` in `@sanad/audit` (U3). Idempotent.

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
