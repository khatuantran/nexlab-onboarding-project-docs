import { z } from "zod";

/**
 * Char-level safety net for section body. Real byte limit (64 KiB)
 * enforced server-side via Buffer.byteLength before parse — see US-002
 * T5. This max keeps Zod parse bounded; 1 char per byte is a generous
 * upper bound even for multi-byte UTF-8.
 */
export const SECTION_BODY_MAX_CHARS = 65536;

export const updateSectionRequestSchema = z.object({
  body: z.string().max(SECTION_BODY_MAX_CHARS, "Nội dung section quá lớn"),
});

export type UpdateSectionRequest = z.infer<typeof updateSectionRequestSchema>;
