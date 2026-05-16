import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

export type EntityGroupAccent = "purple" | "orange" | "green" | "blue" | "rose";

export interface EntityGroupProps {
  icon: ComponentType<LucideProps>;
  title: string;
  count: number;
  accent?: EntityGroupAccent;
  children: ReactNode;
}

const ACCENT_STYLE: Record<EntityGroupAccent, { plate: string; pill: string }> = {
  purple: {
    plate: "bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6] text-white",
    pill: "bg-[#8B5CF6]/10 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#C4B5FD]",
  },
  orange: {
    plate: "bg-gradient-to-br from-[#FB923C] to-[#F07613] text-white",
    pill: "bg-[#F07613]/10 text-[#C2410C] dark:bg-[#F07613]/20 dark:text-[#FDBA74]",
  },
  green: {
    plate: "bg-gradient-to-br from-[#34D399] to-[#10B981] text-white",
    pill: "bg-[#10B981]/10 text-[#047857] dark:bg-[#10B981]/20 dark:text-[#6EE7B7]",
  },
  blue: {
    plate: "bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white",
    pill: "bg-[#3B82F6]/10 text-[#1D4ED8] dark:bg-[#3B82F6]/20 dark:text-[#93C5FD]",
  },
  rose: {
    plate: "bg-gradient-to-br from-[#FB7185] to-[#F43F5E] text-white",
    pill: "bg-[#F43F5E]/10 text-[#BE123C] dark:bg-[#F43F5E]/20 dark:text-[#FDA4AF]",
  },
};

/**
 * Wrapper for one search-result entity group (Projects / Features /
 * Sections / Authors / Uploads). Caller is responsible for skipping
 * render when count = 0; this component assumes at least one hit.
 */
export function EntityGroup({
  icon: Icon,
  title,
  count,
  accent = "purple",
  children,
}: EntityGroupProps): JSX.Element {
  const style = ACCENT_STYLE[accent];
  return (
    <section aria-labelledby={`group-${title}`} className="mb-8">
      <header className="mb-3.5 flex items-center gap-2.5">
        <span
          className={`inline-flex size-8 items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(0,0,0,0.18)] ${style.plate}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <h2
          id={`group-${title}`}
          className="font-display text-base font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <span className={`rounded-full px-2 py-0.5 font-ui text-xs font-bold ${style.pill}`}>
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
