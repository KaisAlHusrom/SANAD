/** A 3- or 6-digit hex color (`#abc` / `#aabbcc`) — the shape branding colors use; the
 * same pattern the `brandingUpdateRequestSchema` validates server-side (U3). */
export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** True for a valid 3/6-digit hex color string. */
export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

/** Expand `#abc` → `#aabbcc`; a native `<input type="color">` needs a full 6-digit hex. */
export function expandHex(value: string): string {
  const match = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  if (match) {
    const [, r, g, b] = match;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return value;
}
