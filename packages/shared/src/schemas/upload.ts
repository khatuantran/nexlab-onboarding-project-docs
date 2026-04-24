import { z } from "zod";

/**
 * Whitelist of accepted image MIMEs for uploads (FR-UPLOAD-001).
 * Enforced twice on BE: Content-Type header + magic-byte sniff via file-type.
 */
export const UPLOAD_MIME_WHITELIST = ["image/png", "image/jpeg", "image/webp"] as const;

export type UploadMimeType = (typeof UPLOAD_MIME_WHITELIST)[number];

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB

export const uploadResponseSchema = z.object({
  id: z.string().uuid(),
  url: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  mimeType: z.enum(UPLOAD_MIME_WHITELIST),
  createdAt: z.string().datetime(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
