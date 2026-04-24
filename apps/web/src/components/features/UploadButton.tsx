import { useRef, type ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { UploadResponse } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useUpload } from "@/queries/uploads";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  featureId: string;
  onUploaded: (markdown: string, upload: UploadResponse) => void;
}

export function UploadButton({ featureId, onUploaded }: UploadButtonProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mutation = useUpload(featureId);

  const handleClick = (): void => {
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again later.
    e.target.value = "";
    if (!file) return;
    mutation.mutate(file, {
      onSuccess: (up) => {
        const alt = file.name.replace(/\.[^.]+$/, "") || "upload";
        const markdown = `![${alt}](${up.url})`;
        onUploaded(markdown, up);
        toast.success("Đã upload");
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          if (err.code === "FILE_TOO_LARGE") {
            toast.error("File quá lớn (max 5 MiB)");
            return;
          }
          if (err.code === "UNSUPPORTED_MEDIA_TYPE") {
            toast.error("Chỉ chấp nhận png, jpg, webp");
            return;
          }
        }
        toast.error(err.message || "Có lỗi xảy ra, thử lại");
      },
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending || undefined}
      >
        <ImagePlus className="mr-2 size-4" aria-hidden="true" />
        {mutation.isPending ? "Đang upload..." : "Upload ảnh"}
      </Button>
    </>
  );
}
