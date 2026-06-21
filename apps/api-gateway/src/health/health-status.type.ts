/**
 * The minimal liveness/readiness result the gateway reports (MS8).
 * `status` mirrors terminus' overall status string ('ok' | 'error' | 'shutting_down').
 */
export interface HealthStatus {
  status: string;
}
