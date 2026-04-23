import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { FilterChip } from "@/components/common/FilterChip";
import { useSearch } from "@/queries/search";

export function SearchPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const projectSlug = params.get("projectSlug") ?? undefined;

  const { data: hits, isLoading, isError } = useSearch({ q, projectSlug });

  const removeScope = (): void => {
    const next = new URLSearchParams(params);
    next.delete("projectSlug");
    setParams(next, { replace: true });
  };

  if (q === "") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-8 text-center">
        <Search className="size-12 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-base text-foreground">Nhập từ khoá để tìm feature</p>
        <p className="mt-1 text-sm text-muted-foreground">
          VD: &quot;login&quot;, &quot;upload&quot;
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8" aria-busy={isLoading}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Kết quả cho &quot;{q}&quot;</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {isLoading ? "Đang tìm..." : `${hits?.length ?? 0} feature`}
          </p>
        </div>
        {projectSlug && <FilterChip label={`Trong ${projectSlug}`} onRemove={removeScope} />}
      </div>

      {isLoading && (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
            />
          ))}
        </ul>
      )}

      {isError && !isLoading && (
        <p role="alert" className="text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      )}

      {!isLoading && !isError && hits && hits.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-base text-foreground">
            Không tìm thấy feature nào khớp với &quot;{q}&quot;
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thử từ khoá ngắn hơn hoặc kiểm tra chính tả.
          </p>
        </div>
      )}

      {!isLoading && !isError && hits && hits.length > 0 && (
        <ul className="space-y-3">
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
