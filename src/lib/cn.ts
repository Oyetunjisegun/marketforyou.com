/** Tiny className joiner (no external dep needed for this scope). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
