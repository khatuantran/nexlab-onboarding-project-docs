import { useState } from "react";
import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { ProjectResponse } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useArchiveProject } from "@/queries/projects";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditProjectDialog } from "./EditProjectDialog";

interface ProjectActionsMenuProps {
  project: Pick<ProjectResponse, "slug" | "name" | "description">;
}

export function ProjectActionsMenu({ project }: ProjectActionsMenuProps): JSX.Element {
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const archiveMutation = useArchiveProject(project.slug);

  const handleArchive = (): void => {
    const ok = window.confirm(
      `Lưu trữ project "${project.name}"? Project sẽ ẩn khỏi catalog, features + sections giữ nguyên.`,
    );
    if (!ok) return;
    archiveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã lưu trữ project");
        navigate("/");
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 403) {
          toast.error("Bạn không có quyền");
        } else if (err instanceof ApiError && err.status === 404) {
          toast.error("Project không tồn tại");
          navigate("/");
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
          <Button variant="ghost" size="icon" aria-label="Thao tác project" className="h-9 w-9">
            <MoreHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" aria-hidden="true" />
            Sửa project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleArchive}
            disabled={archiveMutation.isPending}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Archive className="mr-2 size-4" aria-hidden="true" />
            Lưu trữ project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
