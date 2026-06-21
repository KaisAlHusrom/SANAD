import type { HealthStatus } from './health-status.type.js';

/**
 * The seam between the controller (thin, U5) and the health-check implementation.
 * Declared as an abstract class so it doubles as the Nest DI token and the type —
 * which keeps the controller testable by plain construction (no DI metadata needed).
 */
export abstract class HealthReporter {
  abstract liveness(): Promise<HealthStatus>;
}
