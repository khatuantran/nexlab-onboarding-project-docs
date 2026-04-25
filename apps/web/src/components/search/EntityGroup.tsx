import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

export interface EntityGroupProps {
  icon: ComponentType<LucideProps>;
  title: string;
  count: number;
  children: ReactNode;
}

/**
 * Wrapper for one search-result entity group (Projects / Features /
 * Sections / Authors / Uploads). Caller is responsible for skipping
 * render when count = 0; this component assumes at least one hit.
 */
export function EntityGroup({ icon: Icon, title, count, children }: EntityGroupProps): JSX.Element {
  return (
    <section aria-labelledby={`group-${title}`} className="mb-8">
      <header className="mb-3 flex items-center gap-2">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        <h2
          id={`group-${title}`}
          className="font-display text-base font-bold tracking-tight text-foreground"
        >
          {title}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 font-ui text-xs font-semibold text-muted-foreground">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}
