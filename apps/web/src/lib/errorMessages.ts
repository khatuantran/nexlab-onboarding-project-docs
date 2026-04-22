import { ErrorCode } from "@onboarding/shared";

/**
 * ErrorCode → Vietnamese user-facing copy.
 * Source of truth: .specs/error-codes.md §Client-side mapping.
 * Keep keys exhaustive via TS satisfies + Record<ErrorCode, string>.
 */
const MESSAGES: Record<ErrorCode, string> = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng",
  UNAUTHENTICATED: "", // silent — caller redirects to /login
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  RATE_LIMITED: "Thử lại sau vài phút",
  PROJECT_NOT_FOUND: "Không tìm thấy project",
  PROJECT_SLUG_TAKEN: "Slug đã được dùng, chọn slug khác",
  FEATURE_NOT_FOUND: "Không tìm thấy feature",
  FEATURE_SLUG_TAKEN: "Slug đã được dùng, chọn slug khác",
  INVALID_SECTION_TYPE: "Loại section không hợp lệ",
  SECTION_TOO_LARGE: "Nội dung section quá lớn (>64 KiB)",
  SEARCH_QUERY_EMPTY: "Nhập từ khoá để tìm",
  SEARCH_QUERY_TOO_LONG: "Từ khoá quá dài",
  FILE_TOO_LARGE: "File quá lớn (max 5 MiB)",
  UNSUPPORTED_MEDIA_TYPE: "Chỉ chấp nhận png, jpg, webp",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ",
  INTERNAL_ERROR: "Có lỗi xảy ra, thử lại",
  NOT_FOUND: "Không tìm thấy",
};

export function messageForCode(code: ErrorCode | string): string {
  return MESSAGES[code as ErrorCode] ?? MESSAGES.INTERNAL_ERROR;
}
