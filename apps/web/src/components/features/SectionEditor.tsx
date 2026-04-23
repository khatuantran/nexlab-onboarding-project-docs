import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import type { SectionType } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUpdateSection } from "@/queries/sections";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownView } from "@/components/common/MarkdownView";

interface Props {
  projectSlug: string;
  featureSlug: string;
  featureId: string;
  type: SectionType;
  initialBody: string;
  onDone: () => void;
}

/**
 * 2-col markdown editor with realtime preview (debounced 200ms).
 * Mobile stacks as simple textarea + preview block; we don't try to
 * render a tab switcher here — the page-level CSS grid handles layout.
 */
export function SectionEditor({
  projectSlug,
  featureSlug,
  featureId,
  type,
  initialBody,
  onDone,
}: Props): JSX.Element {
  const [draft, setDraft] = useState(initialBody);
  const preview = useDebouncedValue(draft, 200);
  const bytes = new Blob([draft]).size;

  const mutation = useUpdateSection(projectSlug, featureSlug, featureId);

  const isDirty = draft !== initialBody;

  const handleCancel = (): void => {
    if (isDirty && !window.confirm("Hủy chỉnh sửa?")) return;
    onDone();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    mutation.mutate(
      { type, body: draft },
      {
        onSuccess: () => {
          toast.success("Đã lưu");
          onDone();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === "SECTION_TOO_LARGE") {
            toast.error("Nội dung section quá lớn (>64 KiB)");
            return;
          }
          toast.error(err.message || "Có lỗi xảy ra, thử lại");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={`Đang chỉnh sửa ${type}`}
      className="rounded-md border border-primary/20 bg-muted/30"
    >
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`editor-${type}`} className="text-xs font-medium text-muted-foreground">
            Markdown source
          </label>
          <Textarea
            id={`editor-${type}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            maxLength={70000}
            aria-describedby={`byte-count-${type}`}
            className="font-mono text-sm"
            autoFocus
          />
          <p id={`byte-count-${type}`} className="text-xs text-muted-foreground">
            {bytes.toLocaleString()} / 65,536 bytes
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          <div
            className="min-h-[12rem] rounded-md border border-border bg-background p-3"
            aria-live="polite"
          >
            {preview.trim().length === 0 ? (
              <p className="text-sm text-muted-foreground">Preview sẽ hiện ở đây.</p>
            ) : (
              <MarkdownView source={preview} />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          Hủy
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending || undefined}
        >
          <Check className="mr-2 size-4" aria-hidden="true" />
          Lưu
        </Button>
      </div>
    </form>
  );
}
