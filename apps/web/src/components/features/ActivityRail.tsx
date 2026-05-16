import { useState } from "react";
import type { SectionResponse } from "@onboarding/shared";
import { Avatar } from "@/components/common/Avatar";
import { TipCard } from "@/components/common/TipCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRelativeVi } from "@/lib/relativeTime";

interface ActivityRailProps {
  /** Optional title forwarded to the "Xem tất cả" drawer header. */
  featureTitle?: string;
  sections: SectionResponse[];
}

interface ActivityItem {
  who: string;
  action: string;
  target: string;
  time: string;
}

const SECTION_LABEL: Record<string, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

/**
 * Right-rail activity feed for FeatureDetailPage (sticky).
 * US-011: drops STATIC_PADDING dummy items; renders only real edits derived from
 * `sections.updated_by/updated_at` (max 4 in the rail).
 * US-017: "Xem tất cả" opens a right-side drawer (Radix Dialog repositioned)
 * showing all 5 sections sorted by updated_at desc — feature scope has at most
 * 5 rows so no fetch / pagination needed beyond what's already on the page.
 */
export function ActivityRail({ featureTitle, sections }: ActivityRailProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const filled = sections.filter((s) => s.body.trim().length > 0 && s.updatedByName);
  const items: ActivityItem[] = filled
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 4)
    .map((s) => ({
      who: s.updatedByName ?? "—",
      action: "cập nhật",
      target: SECTION_LABEL[s.type] ?? s.type,
      time: formatRelativeVi(s.updatedAt),
    }));

  const allRows = sections.slice().sort((a, b) => {
    // Empty bodies sort last regardless of timestamp.
    const aEmpty = a.body.trim().length === 0;
    const bEmpty = b.body.trim().length === 0;
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });

  return (
    <aside aria-label="Hoạt động gần đây" className="sticky top-5 hidden self-start xl:block">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="font-ui text-[13px] font-bold text-foreground">Hoạt động</h3>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-ui text-xs font-semibold text-primary hover:underline"
          >
            Xem tất cả
          </button>
        </div>
        <div className="flex flex-col gap-3.5">
          {items.length === 0 ? (
            <p className="font-body text-xs italic text-muted-foreground">
              Chưa có hoạt động — feature này chưa được chỉnh sửa.
            </p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex gap-2.5">
                <Avatar name={item.who} size="sm" />
                <div className="flex-1 font-body text-xs leading-snug text-foreground/80">
                  <strong className="text-foreground">{item.who}</strong> {item.action}{" "}
                  <span className="font-semibold text-primary">{item.target}</span>
                  <div className="mt-1 font-ui text-[11px] text-muted-foreground">{item.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <TipCard title="MẸO ONBOARDING" className="mt-4">
          Đọc <strong>Nghiệp vụ</strong> trước rồi đến <strong>User flow</strong> để hiểu bối cảnh,
          sau đó mới sang <strong>Tech notes</strong>.
        </TipCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-label="Toàn bộ hoạt động"
          className="!left-auto !right-0 !top-0 !w-full !max-w-md !translate-x-0 !translate-y-0 !rounded-none !h-screen overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Toàn bộ hoạt động{featureTitle ? ` — ${featureTitle}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-6 pb-4">
            {allRows.map((s) => {
              const isEmpty = s.body.trim().length === 0;
              return (
                <div
                  key={s.type}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
                >
                  <span className="font-ui text-[12px] font-bold text-foreground">
                    {SECTION_LABEL[s.type] ?? s.type}
                  </span>
                  {isEmpty ? (
                    <p className="font-body text-xs italic text-muted-foreground">
                      Chưa có nội dung.
                    </p>
                  ) : (
                    <>
                      <span className="font-body text-xs text-muted-foreground">
                        <strong className="text-foreground">{s.updatedByName ?? "—"}</strong> cập
                        nhật {formatRelativeVi(s.updatedAt)}
                      </span>
                      <p className="line-clamp-2 font-body text-xs text-foreground/80">{s.body}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-6 py-3 text-[11px] italic text-muted-foreground">
            Lịch sử chi tiết hơn (revision-level) sẽ ra mắt sau.
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
