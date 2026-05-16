import { useMemo } from "react";
import { FileText, FolderOpen, Paperclip, Search, SearchX, ScrollText, User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { FeatureStatus, SectionType } from "@onboarding/shared";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/common/FilterChip";
import { TipCard } from "@/components/common/TipCard";
import { GradientHero } from "@/components/patterns/GradientHero";
import { AuthorResultCard } from "@/components/search/AuthorResultCard";
import { EntityGroup } from "@/components/search/EntityGroup";
import { FilterBar, type FilterBarValue } from "@/components/search/FilterBar";
import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { SearchResultRow as FeatureResultCard } from "@/components/search/SearchResultRow";
import { SectionResultCard } from "@/components/search/SectionResultCard";
import { UploadResultCard } from "@/components/search/UploadResultCard";
import { isoToPreset, presetToIso } from "@/components/search/TimeRangeDropdown";
import { totalHits, useSearch } from "@/queries/search";

const SECTION_TYPE_VALUES = [
  "business",
  "user-flow",
  "business-rules",
  "tech-notes",
  "screenshots",
] as const;

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

function parseSectionTypes(raw: string | null): SectionType[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SectionType => (SECTION_TYPE_VALUES as readonly string[]).includes(s));
}

function parseStatus(raw: string | null): FeatureStatus | undefined {
  if (raw === "filled" || raw === "partial" || raw === "empty") return raw;
  return undefined;
}

export function SearchPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q")?.trim() ?? "";
  const projectSlug = params.get("projectSlug") ?? undefined;
  const sectionTypes = parseSectionTypes(params.get("sectionTypes"));
  const authorId = params.get("authorId") ?? undefined;
  const updatedSince = params.get("updatedSince") ?? undefined;
  const status = parseStatus(params.get("status"));
  const authorDisplayName = params.get("authorName") ?? undefined;

  const sectionTypesKey = sectionTypes.join(",");
  const filterValue = useMemo<FilterBarValue>(
    () => ({
      sectionTypes,
      authorId,
      authorDisplayName,
      timeRange: isoToPreset(updatedSince),
      status,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionTypesKey, authorId, authorDisplayName, updatedSince, status],
  );

  const { data, isLoading, isError } = useSearch({
    q,
    projectSlug,
    sectionTypes: sectionTypes.length > 0 ? sectionTypes : undefined,
    authorId,
    updatedSince,
    status,
  });

  const hitsTotal = totalHits(data);
  const filtersActive =
    sectionTypes.length > 0 ||
    authorId !== undefined ||
    updatedSince !== undefined ||
    status !== undefined;

  const updateFilters = (next: FilterBarValue): void => {
    const url = new URLSearchParams(params);
    if (next.sectionTypes.length > 0) url.set("sectionTypes", next.sectionTypes.join(","));
    else url.delete("sectionTypes");
    if (next.authorId) {
      url.set("authorId", next.authorId);
      if (next.authorDisplayName) url.set("authorName", next.authorDisplayName);
      else url.delete("authorName");
    } else {
      url.delete("authorId");
      url.delete("authorName");
    }
    const iso = presetToIso(next.timeRange);
    if (iso) url.set("updatedSince", iso);
    else url.delete("updatedSince");
    if (next.status) url.set("status", next.status);
    else url.delete("status");
    setParams(url, { replace: true });
  };

  const clearFilter = (key: string): void => {
    const url = new URLSearchParams(params);
    if (key === "authorId") {
      url.delete("authorId");
      url.delete("authorName");
    } else {
      url.delete(key);
    }
    setParams(url, { replace: true });
  };

  const removeScope = (): void => clearFilter("projectSlug");

  // Idle state — q empty.
  if (q === "") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Search className="mx-auto size-16 text-primary/40" aria-hidden="true" />
        <h1 className="mt-6 font-display text-xl font-semibold text-foreground">
          Tìm trong workspace
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập từ khoá vào search box ở thanh top để tìm projects, features, sections, tác giả,
          file.
        </p>
        <TipCard title="MẸO TÌM KIẾM" className="mt-6 text-left">
          <ul className="list-disc space-y-1 pl-4">
            <li>Tìm theo title hoặc nội dung section.</li>
            <li>Filter loại section để tìm theme cụ thể (vd. user-flow cho business flow).</li>
            <li>Filter tác giả + thời gian để zoom vào edits gần đây.</li>
          </ul>
        </TipCard>
      </main>
    );
  }

  return (
    <main className="bg-background pb-16" aria-busy={isLoading}>
      {/* Dark vivid hero */}
      <GradientHero
        showWatermark
        gridOverlay
        className="px-10 pb-10 pt-9"
        blobs={[
          { color: "rgba(59,130,246,0.4)", size: 320, pos: { top: -60, left: -40 } },
          { color: "rgba(240,118,19,0.35)", size: 260, pos: { bottom: -30, right: 100 } },
        ]}
      >
        <span className="mb-3 inline-flex items-center rounded-full border border-blue-500/45 bg-blue-500/[0.22] px-3.5 py-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-blue-200">
          ✦ Tìm kiếm
        </span>
        <h1 className="font-display text-[32px] font-black leading-[38px] tracking-[-0.025em] text-white sm:text-[40px] sm:leading-[44px]">
          Kết quả cho{" "}
          <span className="bg-gradient-to-r from-[hsl(var(--logo-grad-start))] to-[hsl(var(--logo-grad-end))] bg-clip-text text-transparent">
            "{q}"
          </span>
        </h1>
        <div
          className="mt-3 flex flex-wrap items-baseline gap-x-2 font-body text-[15px] text-white/70"
          aria-live="polite"
        >
          {isLoading ? (
            <span>Đang tìm...</span>
          ) : (
            <>
              <span className="font-semibold text-white">{`${hitsTotal} kết quả`}</span>
              <span>· {projectSlug ? `trong project ${projectSlug}` : "trong toàn workspace"}</span>
            </>
          )}
        </div>
      </GradientHero>

      <div className="mx-auto max-w-5xl px-10 pt-6">
        {/* Scope chip + filter bar */}
        {projectSlug ? (
          <div className="mb-3 flex items-center gap-2">
            <span className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Phạm vi:
            </span>
            <FilterChip label={`Project: ${projectSlug}`} onRemove={removeScope} />
          </div>
        ) : null}
        <FilterBar value={filterValue} onChange={updateFilters} />

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

        {!isLoading && !isError && hitsTotal === 0 && (
          <div className="mx-auto max-w-md py-12 text-center">
            <SearchX className="mx-auto size-16 text-primary/40" aria-hidden="true" />
            <h2 className="mt-6 font-display text-xl font-semibold text-foreground">
              {filtersActive
                ? "Không có kết quả với filter hiện tại"
                : `Không tìm thấy feature nào khớp với "${q}"`}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thử từ khoá khác hoặc bỏ filter. FTS hỗ trợ tiếng Việt có dấu — kiểm tra chính tả nếu
              kết quả trống.
            </p>
            {filtersActive && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {sectionTypes.length > 0 && (
                  <FilterChip
                    label={`Loại: ${sectionTypes.join(", ")}`}
                    onRemove={() => clearFilter("sectionTypes")}
                  />
                )}
                {authorId && (
                  <FilterChip
                    label={`Tác giả: ${authorDisplayName ?? "đã chọn"}`}
                    onRemove={() => clearFilter("authorId")}
                  />
                )}
                {updatedSince && (
                  <FilterChip label="Thời gian" onRemove={() => clearFilter("updatedSince")} />
                )}
                {status && (
                  <FilterChip
                    label={`Trạng thái: ${status}`}
                    onRemove={() => clearFilter("status")}
                  />
                )}
              </div>
            )}
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

        {!isLoading && !isError && hitsTotal > 0 && data && (
          <div>
            {data.projects.length > 0 && (
              <EntityGroup icon={FolderOpen} title="Projects" count={data.projects.length}>
                {data.projects.map((hit) => (
                  <ProjectResultCard key={hit.slug} hit={hit} />
                ))}
              </EntityGroup>
            )}
            {data.features.length > 0 && (
              <EntityGroup icon={FileText} title="Features" count={data.features.length}>
                {data.features.map((hit) => (
                  <FeatureResultCard key={`${hit.projectSlug}/${hit.featureSlug}`} hit={hit} />
                ))}
              </EntityGroup>
            )}
            {data.sections.length > 0 && (
              <EntityGroup icon={ScrollText} title="Sections" count={data.sections.length}>
                {data.sections.map((hit) => (
                  <SectionResultCard
                    key={`${hit.projectSlug}/${hit.featureSlug}/${hit.sectionType}`}
                    hit={hit}
                  />
                ))}
              </EntityGroup>
            )}
            {data.authors.length > 0 && (
              <EntityGroup icon={User} title="Authors" count={data.authors.length}>
                {data.authors.map((hit) => (
                  <AuthorResultCard key={hit.id} hit={hit} />
                ))}
              </EntityGroup>
            )}
            {data.uploads.length > 0 && (
              <EntityGroup icon={Paperclip} title="Uploads" count={data.uploads.length}>
                {data.uploads.map((hit) => (
                  <UploadResultCard key={hit.id} hit={hit} />
                ))}
              </EntityGroup>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
