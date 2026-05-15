/**
 * Deterministic avatar color/initial helpers per visual-language.md §10.
 * Hash slug → 1 of 5 primary-ramp gradient buckets cho project identity.
 */

// Pin gradient to literal HSL (Nexlab primary ramp light-mode values) so
// avatar identity is theme-invariant — token names invert in dark mode,
// which collapses contrast against the white initials. Buckets stay in the
// saturated 28-72% lightness range; white text passes 4.5:1 on all.
const BUCKETS = [
  "from-[hsl(32_91%_72%)] to-[hsl(27_88%_51%)]",
  "from-[hsl(28_89%_61%)] to-[hsl(25_84%_48%)]",
  "from-[hsl(27_88%_51%)] to-[hsl(22_82%_40%)]",
  "from-[hsl(25_84%_48%)] to-[hsl(17_73%_34%)]",
  "from-[hsl(22_82%_40%)] to-[hsl(15_69%_28%)]",
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
