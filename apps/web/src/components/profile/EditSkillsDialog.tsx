import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { SKILL_COLORS, type SkillColor, type SkillItem } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useUpdateMySkills } from "@/queries/skills";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * US-018 — colored chip palette shared by SkillsCard + EditSkillsDialog.
 * Keep keys in sync with `SKILL_COLORS` (shared package) — when adding
 * an 8th hue, update both spots + Zod enum at server.
 */
export const SKILL_COLOR_HEX: Record<SkillColor, string> = {
  purple: "#8B5CF6",
  orange: "#F59E0B",
  green: "#10B981",
  blue: "#3B82F6",
  rose: "#F43F5E",
  amber: "#FBBF24",
  primary: "#F07613",
};

const COLOR_LABEL_VI: Record<SkillColor, string> = {
  purple: "Tím",
  orange: "Cam",
  green: "Xanh lá",
  blue: "Xanh dương",
  rose: "Hồng",
  amber: "Vàng",
  primary: "Cam đậm",
};

const SKILLS_CAP = 12;

interface EditSkillsDialogProps {
  skills: SkillItem[];
  trigger: React.ReactNode;
}

interface Row {
  label: string;
  color: SkillColor;
}

export function EditSkillsDialog({ skills, trigger }: EditSkillsDialogProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [labelError, setLabelError] = useState<string | null>(null);
  const mutation = useUpdateMySkills();

  // Reset rows from props every time the dialog opens — prevents stale edits.
  useEffect(() => {
    if (open) {
      setRows(skills.length > 0 ? skills.map((s) => ({ label: s.label, color: s.color })) : []);
      setLabelError(null);
    }
  }, [open, skills]);

  const addRow = (): void => {
    if (rows.length >= SKILLS_CAP) return;
    setRows([...rows, { label: "", color: "primary" }]);
  };
  const removeRow = (idx: number): void => setRows(rows.filter((_, i) => i !== idx));
  const moveUp = (idx: number): void => {
    if (idx === 0) return;
    const copy = rows.slice();
    [copy[idx - 1], copy[idx]] = [copy[idx]!, copy[idx - 1]!];
    setRows(copy);
  };
  const moveDown = (idx: number): void => {
    if (idx === rows.length - 1) return;
    const copy = rows.slice();
    [copy[idx + 1], copy[idx]] = [copy[idx]!, copy[idx + 1]!];
    setRows(copy);
  };
  const setRow = (idx: number, patch: Partial<Row>): void => {
    const copy = rows.slice();
    copy[idx] = { ...copy[idx]!, ...patch };
    setRows(copy);
  };

  const submit = (): void => {
    const trimmed = rows.map((r) => ({ ...r, label: r.label.trim() }));
    if (trimmed.some((r) => r.label.length === 0)) {
      setLabelError("Tên skill không được trống");
      return;
    }
    const seen = new Set<string>();
    for (const r of trimmed) {
      const k = r.label.toLowerCase();
      if (seen.has(k)) {
        setLabelError(`Skill "${r.label}" bị trùng`);
        return;
      }
      seen.add(k);
    }
    setLabelError(null);
    mutation.mutate(
      { skills: trimmed },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật skills");
          setOpen(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 400) {
            setLabelError(err.message || "Dữ liệu không hợp lệ");
          } else {
            toast.error("Có lỗi xảy ra, thử lại sau");
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa skills</DialogTitle>
          <DialogDescription>
            Tối đa {SKILLS_CAP} skill. Tên không phân biệt hoa thường để tránh trùng.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 px-6 pb-4">
          {rows.length === 0 ? (
            <p className="font-body text-xs italic text-muted-foreground">
              Chưa có skill — bấm "Thêm skill" để bắt đầu.
            </p>
          ) : (
            rows.map((row, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border border-border p-2"
              >
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: SKILL_COLOR_HEX[row.color] }}
                />
                <Input
                  aria-label={`Tên skill ${idx + 1}`}
                  value={row.label}
                  onChange={(e) => setRow(idx, { label: e.target.value })}
                  className="h-8 flex-1"
                  placeholder="VD: SQL"
                />
                <select
                  aria-label={`Màu skill ${idx + 1}`}
                  value={row.color}
                  onChange={(e) => setRow(idx, { color: e.target.value as SkillColor })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {SKILL_COLORS.map((c) => (
                    <option key={c} value={c}>
                      {COLOR_LABEL_VI[c]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Lên ${idx + 1}`}
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronUp className="mx-auto size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Xuống ${idx + 1}`}
                  onClick={() => moveDown(idx)}
                  disabled={idx === rows.length - 1}
                  className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                >
                  <ChevronDown className="mx-auto size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Xoá ${idx + 1}`}
                  onClick={() => removeRow(idx)}
                  className="size-7 shrink-0 rounded-md text-destructive hover:bg-destructive/10"
                >
                  <X className="mx-auto size-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={addRow}
            disabled={rows.length >= SKILLS_CAP}
            title={rows.length >= SKILLS_CAP ? `Tối đa ${SKILLS_CAP} skill` : undefined}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed border-border bg-transparent px-3 py-2 font-ui text-[12px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Thêm skill
          </button>
          {labelError ? (
            <p role="alert" className="text-xs text-destructive">
              {labelError}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={mutation.isPending}
            aria-busy={mutation.isPending || undefined}
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
