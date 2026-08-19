import { formatPhoneInternational } from '@sanad/contracts';

/**
 * A stored E.164 number, rendered readable and one tap from a call. Numbers are LTR in both
 * locales (U7). Formatting comes from the shared contracts helper — the same one the team
 * alert email uses, so the inbox and the email never disagree (F8/U3).
 */
export function PhoneLink({
  value,
  fallback,
  className,
}: {
  value: string | null;
  fallback: string;
  className?: string;
}) {
  if (!value) {
    return <span className={className}>{fallback}</span>;
  }
  return (
    <a
      href={`tel:${value}`}
      dir="ltr"
      className={
        className
          ? `${className} hover:text-text hover:underline`
          : 'hover:text-text hover:underline'
      }
    >
      {formatPhoneInternational(value)}
    </a>
  );
}
