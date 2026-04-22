/// <reference types="vite/client" />
import type { ApiErrorShape, ApiSuccessShape, ErrorCode } from "@onboarding/shared";

/**
 * API base URL — must come from Vite env so staging/prod builds point at
 * the right backend. Default keeps local dev working without `.env.local`.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiFetchInit extends RequestInit {
  /** Skip auto JSON body parse (e.g., for binary downloads). */
  raw?: boolean;
}

/**
 * Wrapper around fetch:
 * - Prepends BASE_URL when path starts with "/".
 * - Sets credentials: "include" (cookie session).
 * - Parses `{ data }` success wrapper → returns inner T.
 * - Parses `{ error: { code, message } }` failures → throws ApiError.
 */
export async function apiFetch<T = unknown>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { raw, headers, ...rest } = init;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
  });

  if (raw) return res as unknown as T;

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = parsed as ApiErrorShape | null;
    const code = (err?.error?.code ?? "INTERNAL_ERROR") as ErrorCode;
    const message = err?.error?.message ?? `Request failed: ${res.status}`;
    throw new ApiError(res.status, code, message, err?.error?.details);
  }

  // Success envelope `{ data: T }` or raw T (health endpoint returns raw).
  const body = parsed as ApiSuccessShape<T> | T | null;
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiSuccessShape<T>).data;
  }
  return body as T;
}
