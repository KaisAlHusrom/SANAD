/** Thrown by `findOrFail()` / mutations on a missing row. The exception filter maps it to HTTP 404. */
export class RecordNotFoundError extends Error {
  constructor(
    public readonly model: string,
    public readonly id: string,
  ) {
    super(`${model} not found: ${id}`);
    this.name = 'RecordNotFoundError';
  }
}
