import { toast } from "sonner";
import type { SectionResponse } from "@onboarding/shared";
import { Avatar } from "@/components/common/Avatar";
import { TipCard } from "@/components/common/TipCard";
import { formatRelativeVi } from "@/lib/relativeTime";

interface ActivityRailProps {
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
 * US-011 (CR-006 v4.6 mock audit): drops STATIC_PADDING dummy items.
 * Renders only real edits derived from `sections.updated_by/updated_at`
 * (max 4). Empty when no section is edited yet.
 */
export function ActivityRail({ sections }: ActivityRailProps): JSX.Element {
  const items: ActivityItem[] = sections
    .filter((s) => s.body.trim().length > 0 && s.updatedByName)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 4)
    .map((s) => ({
      who: s.updatedByName ?? "—",
      action: "cập nhật",
      target: SECTION_LABEL[s.type] ?? s.type,
      time: formatRelativeVi(s.updatedAt),
    }));

  return (
    <aside aria-label="Hoạt động gần đây" className="sticky top-5 hidden self-start xl:block">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="font-ui text-[13px] font-bold text-foreground">Hoạt động</h3>
          <button
            type="button"
            onClick={() => toast("Lịch sử hoạt động đầy đủ: tính năng đang phát triển trong v2")}
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
    </aside>
  );
}
