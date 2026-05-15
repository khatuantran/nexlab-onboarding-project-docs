import { Archive, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useArchiveFeature } from "@/queries/projects";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FeatureActionsMenuProps {
  projectSlug: string;
  feature: { slug: string; title: string };
}

/**
 * US-008 admin overflow menu trên FeatureCard. Single item "Lưu trữ
 * feature" — Edit dialog deferred. Mirror visual + flow của
 * `ProjectActionsMenu` (US-004). Native window.confirm trước POST;
 * sau success: toast + cache invalidate (handled by useArchiveFeature).
 */
export function FeatureActionsMenu({ projectSlug, feature }: FeatureActionsMenuProps): JSX.Element {
  const archiveMutation = useArchiveFeature(projectSlug, feature.slug);

  const handleArchive = (): void => {
    const ok = window.confirm(
      `Lưu trữ feature "${feature.title}"? Feature sẽ ẩn khỏi catalog, sections + uploads giữ nguyên.`,
    );
    if (!ok) return;
    archiveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã lưu trữ feature");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 403) {
          toast.error("Bạn không có quyền");
        } else if (err instanceof ApiError && err.status === 404) {
          toast.error("Feature không tồn tại");
        } else {
          toast.error("Có lỗi xảy ra, thử lại sau");
        }
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Thao tác feature" className="h-8 w-8">
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={handleArchive}
          disabled={archiveMutation.isPending}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Archive className="mr-2 size-4" aria-hidden="true" />
          Lưu trữ feature
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
