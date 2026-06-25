import { Button } from '../ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** The shared error affordance (F3) — renders the normalized `ApiError.message`. */
export function ErrorState({ message, onRetry, retryLabel }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-surface p-10 text-center">
      <p className="text-bad">{message}</p>
      {onRetry && retryLabel ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
