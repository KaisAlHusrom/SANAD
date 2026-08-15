-- Database-per-service (MS5): one Postgres container, a distinct database per service
-- so each owns its schema + Drizzle migrations with no __drizzle_migrations collision.
-- Each service also gets a dedicated *_test database for DB-touching tests (TDD2).
-- Runs once, on first initialisation of an empty data volume.

CREATE DATABASE identity;
CREATE DATABASE identity_test;

CREATE DATABASE settings;
CREATE DATABASE settings_test;

CREATE DATABASE media;
CREATE DATABASE media_test;

CREATE DATABASE content;
CREATE DATABASE content_test;

CREATE DATABASE notifications;
CREATE DATABASE notifications_test;

-- P8.8: the shared platform libs own table FRAGMENTS, not databases — but their integration
-- tests still need real tables, and TDD2 forbids borrowing a service's. One `*_test` database
-- each, so the two libs' Drizzle migration journals can never collide (MS5) and a parallel test
-- run cannot race them. These are test-only; no service ever connects to them.
CREATE DATABASE sequence_test;
CREATE DATABASE audit_test;
