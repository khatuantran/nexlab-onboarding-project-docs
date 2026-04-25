import { ChevronDown, Search, SearchX } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/common/FilterChip";
import { TipCard } from "@/components/common/TipCard";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { useSearch } from "@/queries/search";

function ResultSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function SearchPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q")?.trim() ?? "";
  const projectSlug = params.get("projectSlug") ?? undefined;

  const { data: hits, isLoading, isError } = useSearch({ q, projectSlug });

  const removeScope = (): void => {
    const next = new URLSearchParams(params);
    next.delete("projectSlug");
    setParams(next, { replace: true });
  };

  // Idle state
  if (q === "") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Search className="mx-auto size-16 text-primary/40" aria-hidden="true" />
        <h1 className="mt-6 font-display text-xl font-semibold text-foreground">
          Tìm trong workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập từ khoá vào search box ở thanh top để tìm features. FTS hỗ trợ tiếng Việt có dấu.
        </p>
        <TipCard title="MẸO TÌM KIẾM" className="mt-6 text-left">
          <ul className="list-disc space-y-1 pl-4">
            <li>Tìm theo title hoặc nội dung section.</li>
            <li>
              Bao quanh cụm từ với <code className="rounded bg-muted px-1 py-0.5">"..."</code> để
              match exact phrase.
            </li>
            <li>
              Filter theo project bằng cách click chip <strong>Project: ...</strong> trên kết quả.
            </li>
          </ul>
        </TipCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-7 lg:px-10" aria-busy={isLoading}>
      {/* Hero block */}
      <div className="mb-6">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Tìm kiếm
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-foreground">
          Kết quả cho <span className="text-primary">"{q}"</span>
        </h1>
        <div
          className="mt-2 flex flex-wrap items-baseline gap-x-2 text-base text-muted-foreground"
          aria-live="polite"
        >
          {isLoading ? (
            <span>Đang tìm...</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{`${hits?.length ?? 0} feature`}</span>
              <span>· {projectSlug ? `trong project ${projectSlug}` : "trong toàn workspace"}</span>
            </>
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Phạm vi:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {!projectSlug ? (
            <span className="inline-flex h-7 items-center rounded-md bg-card px-3 font-ui text-xs font-semibold text-foreground shadow-sm">
              Toàn workspace
            </span>
          ) : (
            <FilterChip label={`Project: ${projectSlug}`} onRemove={removeScope} />
          )}
          <button
            type="button"
            onClick={() => toast("Filter loại: tính năng đang phát triển trong v2")}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-transparent px-3 font-ui text-xs font-semibold text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Loại: Tất cả
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-ui text-xs text-muted-foreground">Sắp xếp:</span>
          <button
            type="button"
            onClick={() => toast("Sắp xếp: tính năng đang phát triển trong v2")}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2.5 font-ui text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Liên quan nhất
            <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading && (
        <div className="space-y-3.5">
          {[0, 1, 2].map((i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Có lỗi xảy ra, thử lại sau.
        </p>
      )}

      {!isLoading && !isError && hits && hits.length === 0 && (
        <div className="mx-auto max-w-md py-12 text-center">
          <SearchX className="mx-auto size-16 text-primary/40" aria-hidden="true" />
          <h2 className="mt-6 font-display text-xl font-semibold text-foreground">
            Không tìm thấy feature nào khớp với "{q}"
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thử từ khoá khác hoặc bỏ filter project. FTS hỗ trợ tiếng Việt có dấu — kiểm tra chính
            tả nếu kết quả trống.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {projectSlug ? (
              <Button variant="outline" size="sm" type="button" onClick={removeScope}>
                Bỏ filter project
              </Button>
            ) : null}
            <Button variant="default" size="sm" type="button" onClick={() => navigate("/")}>
              Quay về catalog
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && hits && hits.length > 0 && (
        <ul className="space-y-3.5">
          {hits.map((hit) => (
            <li key={`${hit.projectSlug}/${hit.featureSlug}`}>
              <SearchResultRow hit={hit} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
