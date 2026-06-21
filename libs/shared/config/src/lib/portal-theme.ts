/**
 * Portal (admin + client) dual theme — dark default + light — as CSS custom
 * properties. Applied on a `[data-app]` root; `[data-theme="light"]` switches.
 * Locked from the imported designs (design-spec.md §4).
 */

export type PortalVars = Record<string, string>;

export const portalDark: PortalVars = {
  '--bg': '#080b11',
  '--surface': '#0d121b',
  '--surface-2': '#111826',
  '--surface-3': '#161f30',
  '--sidebar': '#0a0e15',
  '--border': 'rgba(255,255,255,0.07)',
  '--border-2': 'rgba(255,255,255,0.12)',
  '--text': '#e7eaf0',
  '--dim': '#97a1b5',
  '--faint': '#5d6678',
  '--accent': '#22d3ee',
  '--accent-2': '#2dd4bf',
  '--accent-3': '#3b82f6',
  '--accent-ink': '#04121a',
  '--accent-soft': 'rgba(34,211,238,0.12)',
  '--accent-line': 'rgba(34,211,238,0.5)',
  '--good': '#34d399',
  '--warn': '#fbbf24',
  '--bad': '#fb7185',
  '--shadow': '0 1px 0 rgba(255,255,255,0.02)',
};

export const portalLight: PortalVars = {
  '--bg': '#f1f3f6',
  '--surface': '#ffffff',
  '--surface-2': '#fafbfc',
  '--surface-3': '#f4f6f9',
  '--sidebar': '#ffffff',
  '--border': 'rgba(12,18,28,0.09)',
  '--border-2': 'rgba(12,18,28,0.16)',
  '--text': '#101826',
  '--dim': '#586173',
  '--faint': '#8b94a4',
  '--accent': '#0e9bb8',
  '--accent-2': '#0f9b8a',
  '--accent-3': '#2563eb',
  '--accent-ink': '#ffffff',
  '--accent-soft': 'rgba(14,155,184,0.10)',
  '--accent-line': 'rgba(14,155,184,0.45)',
  '--good': '#059669',
  '--warn': '#d97706',
  '--bad': '#e11d48',
  '--shadow': '0 1px 2px rgba(12,18,28,0.04)',
};

function declarations(vars: PortalVars): string {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

/** Render the portal theme CSS (dark default on `[data-app]`, light override). */
export function renderPortalThemeCss(): string {
  return [
    `[data-app] {\n${declarations(portalDark)}\n}`,
    `[data-app][data-theme="light"] {\n${declarations(portalLight)}\n}`,
  ].join('\n\n');
}
