import { useState } from "react";
import {
  Briefcase,
  Code,
  Image,
  Info,
  ListChecks,
  Pencil,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SECTION_ORDER, type SectionResponse, type SectionType } from "@onboarding/shared";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { AuthorGate } from "@/components/common/AuthorGate";
import { EmptyDashedCard } from "@/components/common/EmptyDashedCard";
import { MarkdownView } from "@/components/common/MarkdownView";
import { SectionEditor } from "@/components/features/SectionEditor";
import { formatRelativeVi } from "@/lib/relativeTime";

const LABEL: Record<SectionType, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

const ICON: Record<SectionType, LucideIcon> = {
  business: Briefcase,
  "user-flow": Workflow,
  "business-rules": ListChecks,
  "tech-notes": Code,
  screenshots: Image,
};

const EDITOR_ROLE: Record<SectionType, "BA" | "Dev"> = {
  business: "BA",
  "user-flow": "BA",
  "business-rules": "BA",
  "tech-notes": "Dev",
  screenshots: "Dev",
};

interface FeatureSectionsProps {
  projectSlug: string;
  featureSlug: string;
  featureId: string;
  sections: SectionResponse[];
}

export function FeatureSections({
  projectSlug,
  featureSlug,
  featureId,
  sections,
}: FeatureSectionsProps): JSX.Element {
  const byType = new Map(sections.map((s) => [s.type, s]));
  const [editing, setEditing] = useState<Set<SectionType>>(new Set());

  const openEdit = (type: SectionType): void => {
    setEditing((prev) => new Set(prev).add(type));
  };
  const closeEdit = (type: SectionType): void => {
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(type);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {SECTION_ORDER.map((type) => {
        const section = byType.get(type);
        const body = section?.body ?? "";
        const hasBody = body.trim().length > 0;
        const isEditing = editing.has(type);
        const Icon = ICON[type];
        return (
          <section
            key={type}
            id={`section-${type}`}
            aria-labelledby={`heading-${type}`}
            className="scroll-mt-24 rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-3.5 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-lg shrink-0",
                  hasBody ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <h2
                id={`heading-${type}`}
                className="flex-1 line-clamp-1 font-display text-[18px] leading-none font-bold text-foreground"
              >
                {LABEL[type]}
              </h2>
              {hasBody && !isEditing && section ? (
                <span className="hidden md:inline font-ui text-xs text-muted-foreground">
                  Cập nhật bởi{" "}
                  <strong className="text-foreground/80">
                    @{section.updatedByName ?? "(người dùng đã xóa)"}
                  </strong>{" "}
                  · {formatRelativeVi(section.updatedAt)}
                </span>
              ) : null}
              {!isEditing && (
                <AuthorGate>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => openEdit(type)}
                    aria-label={`Sửa section ${LABEL[type]}`}
                  >
                    <Pencil className="mr-1.5 size-3.5" aria-hidden="true" />
                    Sửa
                  </Button>
                </AuthorGate>
              )}
            </div>
            {isEditing ? (
              <SectionEditor
                projectSlug={projectSlug}
                featureSlug={featureSlug}
                featureId={featureId}
                type={type}
                initialBody={body}
                onDone={() => closeEdit(type)}
              />
            ) : hasBody ? (
              <MarkdownView source={body} />
            ) : (
              <EmptyDashedCard
                icon={Info}
                title="Chưa có nội dung"
                description={
                  <>
                    {EDITOR_ROLE[type]} hoặc dev chưa điền section này. Bấm <strong>Sửa</strong> để
                    bắt đầu — hoặc dùng template gợi ý.
                  </>
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="h-8"
                    onClick={() => toast("Templates: tính năng đang phát triển trong v2")}
                  >
                    Dùng template
                  </Button>
                }
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
