import { useMemo } from "react";
import { Bookmark, Eye, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AuthorGate } from "@/components/common/AuthorGate";
import { AvatarStack } from "@/components/common/AvatarStack";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { RelativeTime } from "@/components/common/RelativeTime";
import { GradientHero } from "@/components/patterns/GradientHero";
import { ActivityRail } from "@/components/features/ActivityRail";
import { FeatureSections } from "@/components/features/FeatureSections";
import { SectionToc, SectionTocMobile } from "@/components/features/SectionToc";
import { useFeature } from "@/queries/projects";

const SECTION_COLORS = ["#8B5CF6", "#F07613", "#10B981", "#3B82F6", "#F43F5E"]; // 5 sections

function placeholderToast(label: string): () => void {
  return () => toast(`${label}: tính năng đang phát triển trong v2`);
}

function deriveStatus(filled: number): { label: string; tone: "primary" | "success" | "muted" } {
  if (filled >= 5) return { label: "Đủ doc", tone: "success" };
  if (filled >= 1) return { label: "Đang viết", tone: "primary" };
  return { label: "Draft", tone: "muted" };
}

export function FeatureDetailPage(): JSX.Element {
  const { slug = "", featureSlug = "" } = useParams<{
    slug: string;
    featureSlug: string;
  }>();
  const { data, isPending, error } = useFeature(slug, featureSlug);

  const filledCount = useMemo(() => {
    if (!data) return 0;
    return data.sections.filter((s) => s.body.trim().length > 0).length;
  }, [data]);

  if (isPending) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-10" aria-busy="true">
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mb-2 h-8 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
        <div className="mt-7 h-14 animate-pulse rounded-xl bg-muted" />
        <div className="mt-7 grid gap-8 lg:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr_280px]">
          <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </main>
    );
  }

  if (error instanceof ApiError && error.code === "FEATURE_NOT_FOUND") {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">Không tìm thấy feature "{featureSlug}"</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Có thể slug sai, hoặc feature đã bị xóa.
          </p>
          <div className="mt-6">
            <Link
              to={`/projects/${slug}`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ← Về project
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-10" role="alert">
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Có lỗi xảy ra, thử lại sau.
        </p>
      </main>
    );
  }

  const { feature, sections } = data;
  const status = deriveStatus(filledCount);
  const lastUpdater = sections.reduce<{ name: string | null; time: string }>(
    (acc, s) => {
      if (s.body.trim().length > 0 && s.updatedAt > acc.time) {
        return { name: s.updatedByName, time: s.updatedAt };
      }
      return acc;
    },
    { name: null, time: feature.updatedAt },
  );

  const handleQuickEdit = (): void => {
    const empty = sections.find((s) => s.body.trim().length === 0);
    const target = empty ?? sections[0];
    if (!target) return;
    document
      .getElementById(`section-${target.type}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="bg-background pb-16">
      <div className="px-10 pt-4">
        <Breadcrumb
          items={[
            { label: "Projects", to: "/" },
            { label: slug, to: `/projects/${slug}` },
            { label: feature.title },
          ]}
          className="text-xs"
        />
      </div>
      {/* Dark vivid hero — v4 */}
      <GradientHero
        showWatermark
        gridOverlay
        className="mx-10 mb-6 mt-3 rounded-[22px]"
        blobs={[
          { color: "rgba(139,92,246,0.45)", size: 320, pos: { top: -60, left: -40 } },
          { color: "rgba(240,118,19,0.35)", size: 280, pos: { bottom: -40, right: 160 } },
        ]}
      >
        <div className="flex flex-col gap-6 p-[28px_36px_26px] sm:flex-row sm:items-start">
          <div className="flex-1">
            {/* Chips row */}
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-ui text-[11px] font-bold ${
                  status.tone === "success"
                    ? "bg-green-500/25 text-green-200"
                    : status.tone === "primary"
                      ? "bg-primary/25 text-[#FFD092]"
                      : "bg-white/15 text-white/80"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    status.tone === "success"
                      ? "bg-green-400 animate-pulse"
                      : status.tone === "primary"
                        ? "bg-primary animate-pulse"
                        : "bg-white/60"
                  }`}
                />
                {status.label}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-500/25 px-2.5 py-1 font-ui text-[11px] font-bold text-blue-200">
                v2
              </span>
              <span className="font-ui text-[12px] font-medium text-white/75">
                · Cập nhật{" "}
                <RelativeTime
                  iso={feature.updatedAt}
                  showIcon={false}
                  className="inline-flex !text-[12px] !text-white/75"
                />
                {lastUpdater.name ? (
                  <>
                    {" "}
                    · @<strong className="font-semibold text-white/70">{lastUpdater.name}</strong>
                  </>
                ) : null}
              </span>
            </div>

            <h1 className="font-display text-[28px] font-black leading-[34px] tracking-[-0.025em] text-white sm:text-[34px] sm:leading-[40px]">
              {feature.title}
            </h1>

            {/* Section progress dots row */}
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <div className="flex gap-1.5">
                {SECTION_COLORS.map((c, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="h-2 w-14 rounded-full"
                    style={{
                      background: i < filledCount ? c : "rgba(255,255,255,0.15)",
                      boxShadow: i < filledCount ? `0 2px 8px ${c}60` : undefined,
                    }}
                  />
                ))}
              </div>
              <span className="font-ui text-[14px] font-bold text-white/90">
                {filledCount}/5 sections
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="live-dot size-1.5 rounded-full" />
                <AvatarStack names={["TM", "NL"]} size="xs" />
                <span className="font-ui text-[12px] font-medium text-white/65">2 đang chỉnh</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {feature.prUrl ? (
              <a
                href={feature.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xem PR trong tab mới"
                className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2 font-ui text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/15"
              >
                <Eye className="size-3.5" aria-hidden="true" />
                PR
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-label="Chưa link PR"
                title="Chưa link PR — admin có thể thêm trong 'Sửa feature'."
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.06] px-3.5 py-2 font-ui text-[13px] font-semibold text-white/60"
              >
                <Eye className="size-3.5" aria-hidden="true" />
                PR
              </button>
            )}
            <button
              type="button"
              onClick={placeholderToast("Theo dõi feature")}
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3.5 py-2 font-ui text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/15"
            >
              <Bookmark className="size-3.5" aria-hidden="true" />
              Lưu
            </button>
            <AuthorGate>
              <button
                type="button"
                onClick={handleQuickEdit}
                className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-primary to-primary-700 px-4 py-2 font-ui text-[13px] font-bold text-white shadow-[0_4px_16px_rgba(226,99,20,0.45)]"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Sửa nhanh
              </button>
            </AuthorGate>
          </div>
        </div>
      </GradientHero>

      <SectionTocMobile />

      <div className="grid gap-8 px-10 lg:grid-cols-[200px_1fr] xl:grid-cols-[240px_1fr_280px]">
        <SectionToc sections={sections} />
        <article className="min-w-0">
          <FeatureSections
            projectSlug={slug}
            featureSlug={featureSlug}
            featureId={feature.id}
            sections={sections}
          />
        </article>
        <ActivityRail sections={sections} featureTitle={feature.title} />
      </div>
    </main>
  );
}
