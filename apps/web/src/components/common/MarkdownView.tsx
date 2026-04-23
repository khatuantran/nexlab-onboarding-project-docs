import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { renderMarkdown } from "@/lib/markdown";

interface MarkdownViewProps {
  source: string;
  className?: string;
}

export function MarkdownView({ source, className }: MarkdownViewProps): JSX.Element {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      // HTML is sanitized via renderMarkdown (DOMPurify whitelist).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
