/**
 * Splice `insert` into `body` at `cursorPos`. Returns the new body and
 * the new cursor position (end of inserted text). Pure fn for easy test.
 */
export function insertAtCursor(
  body: string,
  insert: string,
  cursorPos: number,
): { body: string; cursor: number } {
  const pos = Math.max(0, Math.min(cursorPos, body.length));
  const before = body.slice(0, pos);
  const after = body.slice(pos);
  return { body: before + insert + after, cursor: pos + insert.length };
}
