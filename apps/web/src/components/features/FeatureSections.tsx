import { useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";
import { SECTION_ORDER, type SectionResponse, type SectionType } from "@onboarding/shared";
import { Button } from "@/components/ui/button";
import { AuthorGate } from "@/components/common/AuthorGate";
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
    <div>
      {SECTION_ORDER.map((type) => {
        const section = byType.get(type);
        const body = section?.body ?? "";
        const hasBody = body.trim().length > 0;
        const isEditing = editing.has(type);
        return (
          <section
            key={type}
            id={`section-${type}`}
            aria-labelledby={`heading-${type}`}
            className="scroll-mt-24"
          >
            <div className="mt-10 mb-4 flex items-start justify-between gap-3 first:mt-0">
              <h2
                id={`heading-${type}`}
                className="font-display text-2xl font-bold tracking-tight text-foreground"
              >
                {LABEL[type]}
              </h2>
              {!isEditing && (
                <AuthorGate>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(type)}
                    aria-label={`Sửa section ${LABEL[type]}`}
                  >
                    <Pencil className="mr-2 size-4" aria-hidden="true" />
                    Sửa
                  </Button>
                </AuthorGate>
              )}
            </div>
            {hasBody && !isEditing && section ? (
              <p className="-mt-3 mb-4 text-xs text-muted-foreground">
                Cập nhật bởi{" "}
                <span className="font-medium text-foreground">
                  @{section.updatedByName ?? "(người dùng đã xóa)"}
                </span>
                , {formatRelativeVi(section.updatedAt)}
              </p>
            ) : null}
            {isEditing ? (
              <SectionEditor
                projectSlug={projectSlug}
                featureSlug={featureSlug}
                featureId={featureId}
                type={type}
                initialBody={body}
                onDone={() => closeEdit(type)}
              />
            ) : body.trim().length === 0 ? (
              <div
                className="flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground"
                role="status"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Chưa có nội dung</p>
                  <p>BA hoặc dev chưa điền section này.</p>
                </div>
              </div>
            ) : (
              <MarkdownView source={body} />
            )}
          </section>
        );
      })}
    </div>
  );
}
