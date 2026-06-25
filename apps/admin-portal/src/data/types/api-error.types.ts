/**
 * The single normalized error shape every consumer sees (F1). `status` is the HTTP
 * status, or `0` for transport/parse errors. `message` is the envelope's `message`
 * (the backend's coded text) when present. `fields` carries per-field validation
 * messages when the backend supplies them.
 */
export interface ApiError {
  status: number;
  message: string;
  kind?: string;
  fields?: Record<string, string>;
}
