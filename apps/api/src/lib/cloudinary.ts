import { v2 as cloudinarySdk, type UploadApiResponse } from "cloudinary";

/**
 * Cloudinary client wrapper (CR-004 Phase 2).
 *
 * Reads CLOUDINARY_URL from the environment via the SDK's default
 * resolver (set by `cloudinary` package automatically when the env var
 * is present). The wrapper layer keeps the rest of the app decoupled
 * from the SDK shape and gives test code a single seam to mock.
 */

export interface CloudinaryClient {
  /** True only when CLOUDINARY_URL is non-empty (creds available). */
  isConfigured(): boolean;
  uploadImage(input: UploadImageInput): Promise<UploadImageResult>;
  /**
   * US-009/US-019 delete amend — best-effort asset removal. Throws on
   * SDK failure; callers swallow + log (DELETE endpoints must clear DB
   * URL regardless). No-op when not configured.
   */
  destroyImage(publicId: string): Promise<void>;
}

/**
 * Parse Cloudinary `secure_url` → `publicId` for `destroy()`.
 *
 * Format: `https://res.cloudinary.com/<cloud>/image/upload/[<transform>/...]v<n>/<publicId>.<ext>`.
 * `publicId` can contain slashes (folder path) and is *not* URL-encoded.
 * Returns `null` if the URL doesn't match (caller skips destroy).
 */
export function publicIdFromUrl(url: string): string | null {
  // Match everything between the last `/v<digits>/` segment and the
  // trailing `.<ext>`. Transformation chunks (eg. `c_fill,w_2000`) sit
  // *before* the version segment, so this regex naturally skips them.
  const m = url.match(/\/upload\/(?:.+\/)?v\d+\/(.+)\.[a-z0-9]+$/i);
  return m?.[1] ?? null;
}

export interface UploadImageInput {
  buffer: Buffer;
  publicId: string; // <folder>/<uuid>
  resourceType?: "image";
  /** Original filename — surfaced in Cloudinary `context.alt` / DB metadata. */
  filename?: string;
}

export interface UploadImageResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  /** Cloudinary's `version` field — useful for cache busting if we ever need it. */
  version: number;
}

export function createCloudinaryClient(cloudinaryUrl: string): CloudinaryClient {
  const configured = cloudinaryUrl.length > 0;
  if (configured) {
    // Setting CLOUDINARY_URL in the env is the SDK's default config path.
    // Re-assert here so the import-time module pickup is deterministic
    // regardless of when the env var was set vs when the SDK loaded.
    process.env.CLOUDINARY_URL = cloudinaryUrl;
    cloudinarySdk.config({ secure: true });
  }

  return {
    isConfigured: () => configured,

    async uploadImage(input) {
      if (!configured) {
        throw new Error("Cloudinary not configured — set CLOUDINARY_URL");
      }

      const response = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinarySdk.uploader.upload_stream(
          {
            public_id: input.publicId,
            resource_type: input.resourceType ?? "image",
            overwrite: false,
            // Original filename for Cloudinary's UI / API consumers.
            context: input.filename ? { alt: input.filename } : undefined,
          },
          (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            if (!result) {
              reject(new Error("Cloudinary upload returned no result"));
              return;
            }
            resolve(result);
          },
        );
        stream.end(input.buffer);
      });

      return {
        publicId: response.public_id,
        secureUrl: response.secure_url,
        bytes: response.bytes,
        format: response.format,
        version: response.version,
      };
    },

    async destroyImage(publicId) {
      if (!configured) return;
      await new Promise<void>((resolve, reject) => {
        cloudinarySdk.uploader.destroy(publicId, { invalidate: true }, (err) => {
          if (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
            return;
          }
          resolve();
        });
      });
    },
  };
}
