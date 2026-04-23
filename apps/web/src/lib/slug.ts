/**
 * Normalize a free-form name into a URL-safe kebab-case slug.
 * Strips Vietnamese diacritics (NFD + remove combining marks) then
 * lowercases, replaces non-alphanumerics with hyphens, collapses runs
 * of hyphens, and trims leading/trailing hyphens.
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
