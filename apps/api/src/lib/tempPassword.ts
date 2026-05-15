import { randomInt } from "node:crypto";

/**
 * 12-character alphanumeric password. Ambiguous glyphs (0/O, 1/I/l) are
 * stripped so admin can dictate over the phone without confusion. ~62^12
 * search space is plenty for a single-use credential that the user must
 * change after first login (FE shows it once, admin copies + shares).
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTempPassword(length = 12): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}
