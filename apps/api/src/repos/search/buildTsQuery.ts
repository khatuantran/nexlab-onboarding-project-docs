/**
 * Build a Postgres `tsquery` literal that prefix-matches each token in the
 * user-supplied search string (US-006 / FR-SEARCH-004).
 *
 * - Accepts arbitrary user input including tsquery operators (`& | ! ( ) :`)
 *   and Unicode letters / Vietnamese diacritics.
 * - Strips every character that is not a Unicode letter or digit, then
 *   tokenizes on whitespace.
 * - Each token is appended with `:*` so to_tsquery treats it as a prefix.
 * - Returns a string suitable for `to_tsquery('simple_unaccent', ...)`.
 *
 * Returns `null` when input contains no usable tokens — callers should treat
 * that as "no match" (route layer returns an empty result, not 4xx, since the
 * empty-query 400 path is handled separately).
 */
export function buildTsQuery(q: string): string | null {
  // \p{L} = any Unicode letter, \p{N} = any digit. Replace everything else
  // (operators, punctuation, control chars) with a space so tsquery never
  // sees a metacharacter.
  const sanitized = q.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (sanitized.length === 0) return null;

  const tokens = sanitized.split(/\s+/);
  return tokens.map((t) => `${t}:*`).join(" & ");
}
