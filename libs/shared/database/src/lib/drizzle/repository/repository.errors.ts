/**
 * Thrown by `findOrFail()` / mutations on a missing row. The shared exception filter maps it to a
 * **404** carrying the localized `common.notFound` (U24) — its own `message` is developer text
 * (it names the table and id) and never reaches the client.
 */
export class RecordNotFoundError extends Error {
  constructor(
    public readonly model: string,
    public readonly id: string,
  ) {
    super(`${model} not found: ${id}`);
    this.name = 'RecordNotFoundError';
  }
}
