/**
 * Next.js (App Router) config for the public Sanad Tech website (P8).
 *
 * `transpilePackages` lets Next consume the workspace libs (`@sanad/web-ui` ships the
 * website Section/Block renderer, `@sanad/config` the tokens, `@sanad/contracts` the
 * shapes) — they resolve to their built `dist` (the repo convention, same as the admin
 * Vite app). ESLint/typecheck run as their own `nx` targets (verifier), so `next build`
 * doesn't double-run them. `@nx/next` infers the build/dev/start targets from this file.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sanad/web-ui', '@sanad/config', '@sanad/contracts'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
