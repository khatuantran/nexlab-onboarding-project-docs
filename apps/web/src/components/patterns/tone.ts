export type PatternTone = "primary" | "blue" | "green" | "purple" | "pink" | "cyan" | "amber";

const TONE_VAR: Record<PatternTone, string> = {
  primary: "--primary",
  blue: "--accent-blue",
  green: "--accent-green",
  purple: "--accent-purple",
  pink: "--accent-pink",
  cyan: "--accent-cyan",
  amber: "--accent-amber",
};

export function toneColor(tone: PatternTone): string {
  return `hsl(var(${TONE_VAR[tone]}))`;
}
