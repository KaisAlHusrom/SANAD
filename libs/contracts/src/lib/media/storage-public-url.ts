/**
 * Is the configured public base actually **publicly readable**?
 *
 * The S3 API endpoint (`https://<account>.r2.cloudflarestorage.com`) and the public bucket host
 * (`https://pub-<hash>.r2.dev`, or a custom domain) are two different things. Point `publicUrl`
 * at the API endpoint and every upload will succeed while every rendered `<img>` 403s, because
 * that host serves only SigV4-signed requests — a failure that looks like "the upload broke"
 * but happens hours later, on the website, to a visitor.
 *
 * Lives in contracts because BOTH sides need the same judgement (U3): media-service reports it
 * from "Test connection", and the admin's storage card warns about it live as the owner types.
 * A predicate, not a Zod refinement — we must never *block* saving a config we merely suspect;
 * an unusual-but-correct setup (a proxy in front of the API host) is the owner's call to make.
 */
export function isSignedOnlyPublicUrl(
  publicUrl: string | null | undefined,
  endpoint: string | null | undefined,
): boolean {
  const publicHost = hostOf(publicUrl);
  if (!publicHost) return false;
  // The S3 API host pattern, independent of whatever `endpoint` says.
  if (publicHost.endsWith('.r2.cloudflarestorage.com')) return true;
  const endpointHost = hostOf(endpoint);
  return endpointHost !== null && endpointHost === publicHost;
}

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    // Not a parseable URL — the field's own `url` validation reports that; not our concern.
    return null;
  }
}
