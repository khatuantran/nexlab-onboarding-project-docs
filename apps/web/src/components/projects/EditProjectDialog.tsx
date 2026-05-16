import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { toast } from "sonner";
import {
  updateProjectRequestSchema,
  type ProjectResponse,
  type UpdateProjectRequest,
} from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useUpdateProject } from "@/queries/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProjectDialogProps {
  project: Pick<ProjectResponse, "slug" | "name" | "description" | "repoUrl">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps): JSX.Element {
  const mutation = useUpdateProject(project.slug);

  const form = useForm<UpdateProjectRequest>({
    resolver: zodResolver(updateProjectRequestSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      repoUrl: project.repoUrl ?? "",
    },
    mode: "onSubmit",
  });

  const { register, handleSubmit, reset, getValues, formState } = form;

  useEffect(() => {
    if (open) {
      reset({
        name: project.name,
        description: project.description ?? "",
        repoUrl: project.repoUrl ?? "",
      });
    }
  }, [open, project.name, project.description, project.repoUrl, reset]);

  const isDirty = (): boolean => {
    const v = getValues();
    return (
      (v.name ?? "").trim() !== project.name.trim() ||
      (v.description ?? "").trim() !== (project.description ?? "").trim() ||
      (v.repoUrl ?? "").trim() !== (project.repoUrl ?? "").trim()
    );
  };

  const handleOpenChange = (next: boolean): void => {
    if (!next && isDirty()) {
      if (!window.confirm("Hủy chỉnh sửa project?")) return;
    }
    onOpenChange(next);
  };

  const onSubmit = (values: UpdateProjectRequest): void => {
    const payload: UpdateProjectRequest = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
    };
    // US-013 repoUrl: empty string → null (explicit clear) only if previously set; otherwise omit.
    const newRepo = (values.repoUrl ?? "").trim();
    const oldRepo = project.repoUrl ?? "";
    if (newRepo !== oldRepo) {
      payload.repoUrl = newRepo === "" ? null : newRepo;
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã cập nhật project");
        onOpenChange(false);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status >= 500) {
          toast.error("Có lỗi xảy ra, thử lại sau");
        } else if (!(err instanceof ApiError) || err.code !== "VALIDATION_ERROR") {
          toast.error(err.message || "Có lỗi xảy ra, thử lại sau");
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa project</DialogTitle>
          <DialogDescription>Cập nhật thông tin project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="epd-name">Tên project *</Label>
              <Input
                id="epd-name"
                autoFocus
                aria-invalid={!!formState.errors.name || undefined}
                aria-describedby={formState.errors.name ? "epd-name-error" : undefined}
                {...register("name")}
              />
              {formState.errors.name && (
                <p id="epd-name-error" role="alert" className="text-xs text-destructive">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="epd-slug">Slug</Label>
              <Input
                id="epd-slug"
                value={project.slug}
                readOnly
                aria-readonly="true"
                aria-describedby="epd-slug-hint"
                tabIndex={-1}
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
              <p id="epd-slug-hint" className="text-xs text-muted-foreground">
                Slug không đổi được sau khi tạo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="epd-desc">Mô tả (tùy chọn)</Label>
              <Textarea id="epd-desc" rows={3} {...register("description")} />
              {formState.errors.description && (
                <p role="alert" className="text-xs text-destructive">
                  {formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="epd-repo">Repo URL (tùy chọn)</Label>
              <Input
                id="epd-repo"
                type="url"
                placeholder="https://github.com/owner/repo"
                aria-invalid={!!formState.errors.repoUrl || undefined}
                aria-describedby={formState.errors.repoUrl ? "epd-repo-error" : "epd-repo-hint"}
                {...register("repoUrl", { setValueAs: (v) => (v === "" ? undefined : v) })}
              />
              <p id="epd-repo-hint" className="text-xs text-muted-foreground">
                Bất kỳ link http(s), tối đa 500 ký tự. Để trống để gỡ link.
              </p>
              {formState.errors.repoUrl && (
                <p id="epd-repo-error" role="alert" className="text-xs text-destructive">
                  {formState.errors.repoUrl.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending || undefined}
            >
              <Check className="mr-2 size-4" aria-hidden="true" />
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
