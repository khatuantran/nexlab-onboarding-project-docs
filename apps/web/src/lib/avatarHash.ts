/**
 * Deterministic avatar color/initial helpers per visual-language.md §10.
 * Hash slug → 1 of 5 primary-ramp gradient buckets cho project identity.
 */

const BUCKETS = [
  "from-primary-200 to-primary-400",
  "from-primary-300 to-primary-500",
  "from-primary-400 to-primary-600",
  "from-primary-500 to-primary-700",
  "from-primary-600 to-primary-800",
] as const;

export function avatarBucket(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return BUCKETS[Math.abs(h) % BUCKETS.length]!;
}

export function avatarInitial(name: string, count = 1): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (count === 1) return trimmed.charAt(0).toUpperCase();
  // 2-char from first word
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return first.slice(0, count).toUpperCase();
}
