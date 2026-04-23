import { AlertCircle } from "lucide-react";
import { SECTION_ORDER, type SectionResponse, type SectionType } from "@onboarding/shared";
import { MarkdownView } from "@/components/common/MarkdownView";

const LABEL: Record<SectionType, string> = {
  business: "Nghiệp vụ",
  "user-flow": "User flow",
  "business-rules": "Business rules",
  "tech-notes": "Tech notes",
  screenshots: "Screenshots",
};

interface FeatureSectionsProps {
  sections: SectionResponse[];
}

export function FeatureSections({ sections }: FeatureSectionsProps): JSX.Element {
  const byType = new Map(sections.map((s) => [s.type, s]));
  return (
    <div>
      {SECTION_ORDER.map((type) => {
        const section = byType.get(type);
        const body = section?.body ?? "";
        return (
          <section
            key={type}
            id={`section-${type}`}
            aria-labelledby={`heading-${type}`}
            className="scroll-mt-24"
          >
            <h2
              id={`heading-${type}`}
              className="mt-10 mb-4 text-xl font-semibold tracking-tight text-foreground first:mt-0"
            >
              {LABEL[type]}
            </h2>
            {body.trim().length === 0 ? (
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
