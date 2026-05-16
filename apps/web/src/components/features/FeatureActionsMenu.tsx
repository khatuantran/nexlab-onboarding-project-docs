import { useState } from "react";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface FeatureActionsMenuProps {
  projectSlug: string;
  feature: { slug: string; title: string };
}

/**
 * US-008 admin overflow menu trên FeatureCard. Single item "Lưu trữ
 * feature" — Edit dialog deferred. Mirror visual + flow của
 * `ProjectActionsMenu` (US-004). Custom `ConfirmDialog` thay native
 * `window.confirm` (v4.6); sau success: toast + cache invalidate
 * (handled by useArchiveFeature).
 */
export function FeatureActionsMenu({ projectSlug, feature }: FeatureActionsMenuProps): JSX.Element {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveMutation = useArchiveFeature(projectSlug, feature.slug);

  const handleArchive = (): void => {
    archiveMutation.mutate(undefined, {
      onSuccess: () => {
        setArchiveOpen(false);
        toast.success("Đã lưu trữ feature");
      },
      onError: (err) => {
        setArchiveOpen(false);
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Thao tác feature" className="h-8 w-8">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => setArchiveOpen(true)}
            disabled={archiveMutation.isPending}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Archive className="mr-2 size-4" aria-hidden="true" />
            Lưu trữ feature
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={(next) => {
          if (!archiveMutation.isPending) setArchiveOpen(next);
        }}
        title={`Lưu trữ feature "${feature.title}"?`}
        description="Feature sẽ ẩn khỏi catalog. Sections và uploads vẫn được giữ nguyên, có thể khôi phục sau."
        confirmLabel="Lưu trữ"
        cancelLabel="Huỷ"
        variant="destructive"
        pending={archiveMutation.isPending}
        onConfirm={handleArchive}
      />
    </>
  );
}
