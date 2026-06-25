import type { SecretRow } from '../hooks/use-secrets-list';
import { SecretTableRow } from './secret-row';

/** The masked-secrets list — one row per registered third party. */
export function SecretsTable({ rows }: { rows: SecretRow[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.entry.key}>
            <SecretTableRow row={row} />
          </li>
        ))}
      </ul>
    </div>
  );
}
