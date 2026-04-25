import { toast } from "sonner";
import type { AuthorHit } from "@onboarding/shared";
import { Avatar } from "@/components/common/Avatar";
import { cn } from "@/lib/cn";

export interface AuthorResultCardProps {
  hit: AuthorHit;
}

export function AuthorResultCard({ hit }: AuthorResultCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => toast("Trang user defer v2")}
      aria-label={`Tác giả ${hit.displayName}`}
      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar name={hit.displayName} size="md" />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-display text-base font-semibold text-foreground">
          {hit.displayName}
        </h3>
        <p className="font-ui text-xs text-muted-foreground">
          Đã touch {hit.touchedFeatureCount} feature
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wide",
          hit.role === "admin"
            ? "bg-primary/10 text-primary-700 dark:text-primary-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {hit.role}
      </span>
    </button>
  );
}
