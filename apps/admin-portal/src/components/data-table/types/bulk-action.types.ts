/**
 * A bulk action run over the selected row ids. `onRun` may be async — the BulkActionsBar
 * awaits it and clears the selection on success (keeps it on failure). `permission` gates
 * visibility; `label` is caller-translated.
 */
export interface BulkAction {
  key: string;
  label: string;
  onRun: (ids: string[]) => Promise<void> | void;
  permission?: string;
  tone?: 'default' | 'danger';
}
