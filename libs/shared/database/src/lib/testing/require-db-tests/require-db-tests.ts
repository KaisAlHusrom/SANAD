/**
 * Turn a "DB unreachable → skip" into a hard failure where the database is guaranteed present.
 *
 * Every `*.int.spec.ts` degrades to `describe.skip` when Postgres is unreachable, which is correct
 * locally: OPS5 requires the dev stack DOWN for the verifier, so the DB genuinely is not there. But
 * it means a suite that has NEVER run still reports green — and it did, in CI, for every one of the
 * nine integration suites, because the workflow had no Postgres service at all.
 *
 * Where the database IS provisioned (CI), set `REQUIRE_DB_TESTS=1` and a skip becomes a failure
 * with the underlying cause attached. A test that cannot run must say so, not pass quietly.
 *
 * Harness-only — never imported by a service, so it is outside U19's typed-accessor rule for the
 * same reason `drizzle.config.ts` is.
 */
export function failIfDbTestsRequired(
  connectionString: string,
  cause: unknown,
): void {
  if (process.env['REQUIRE_DB_TESTS'] !== '1') return;

  const target = connectionString.replace(/\/\/[^@]*@/, '//***@');
  throw new Error(
    `DB integration tests are REQUIRED (REQUIRE_DB_TESTS=1) but ${target} is unusable, ` +
      `so this suite would have skipped and reported green while proving nothing (TDD2).`,
    { cause },
  );
}
