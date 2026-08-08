/**
 * Split a heading into WORDS for staggered reveals (WEB5) — Arabic is cursive/joined, so we
 * NEVER letter-split (it breaks ligatures). Whitespace runs are dropped; each returned word is
 * animated as its own unit. A `<br>` in CMS copy is represented by the literal `'\n'` token,
 * which the renderer turns into a line break (the design's hero/title wraps).
 */
export function splitWords(text: string): string[] {
  return text
    .replace(/<br\s*\/?>(?=)/gi, '\n')
    .split(/(\n)/)
    .flatMap((part) => (part === '\n' ? ['\n'] : part.split(/\s+/)))
    .filter((part) => part.length > 0);
}
