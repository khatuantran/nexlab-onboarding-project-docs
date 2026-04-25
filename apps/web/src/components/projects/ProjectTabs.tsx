import { useState, type ReactNode } from "react";
import { Wrench } from "lucide-react";
import { TabBar, type TabItem } from "@/components/common/TabBar";

interface ProjectTabsProps {
  catalogChildren: ReactNode;
  featureCount: number;
}

const PLACEHOLDER_ITEMS: Array<{ id: string; label: string }> = [
  { id: "activity", label: "Activity" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings" },
];

/**
 * Project landing tab navigation per project-landing.md (CR-002 Phase 1B-2).
 * Catalog tab active and renders feature grid. Activity/Members/Settings
 * are placeholder tabs showing "Đang phát triển trong v2" empty state.
 */
export function ProjectTabs({ catalogChildren, featureCount }: ProjectTabsProps): JSX.Element {
  const [active, setActive] = useState<string>("catalog");

  const items: TabItem[] = [
    { id: "catalog", label: "Catalog", count: featureCount },
    ...PLACEHOLDER_ITEMS,
  ];

  return (
    <div>
      <TabBar items={items} activeId={active} onChange={setActive} className="mb-6" />
      {active === "catalog" ? (
        catalogChildren
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Wrench className="size-10 text-primary/40" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
            Đang phát triển trong v2
          </h2>
          <p className="mt-1 max-w-md font-body text-sm text-muted-foreground">
            Tính năng {items.find((t) => t.id === active)?.label.toLowerCase()} sẽ có ở milestone
            tiếp theo.
          </p>
        </div>
      )}
    </div>
  );
}
