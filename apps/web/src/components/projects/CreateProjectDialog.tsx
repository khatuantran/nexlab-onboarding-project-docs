import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { createProjectRequestSchema, type CreateProjectRequest } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { toSlug } from "@/lib/slug";
import { useCreateProject } from "@/queries/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Admin-only create project dialog. Opens from AppHeader trigger.
 *
 * Slug auto-derives from name until the user touches the slug field,
 * after which it stays sticky (Gate 1 decision). Cancel confirms via
 * native `window.confirm` when the form is dirty.
 */
interface CreateProjectDialogProps {
  triggerLabel?: string;
  /**
   * Optional fully custom trigger element (overrides default Button + label).
   * Passing this wraps your element in DialogTrigger asChild — element must
   * forward refs (e.g., button or styled component).
   */
  customTrigger?: React.ReactElement;
}

export function CreateProjectDialog({
  triggerLabel = "Tạo project",
  customTrigger,
}: CreateProjectDialogProps = {}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [serverSlugError, setServerSlugError] = useState<string | null>(null);
  const navigate = useNavigate();
  const mutation = useCreateProject();

  const form = useForm<CreateProjectRequest>({
    resolver: zodResolver(createProjectRequestSchema),
    defaultValues: { slug: "", name: "", description: "" },
    mode: "onSubmit",
  });

  const { register, handleSubmit, watch, getValues, setValue, reset, formState } = form;
  const name = watch("name");

  useEffect(() => {
    if (!slugTouched) setValue("slug", toSlug(name ?? ""));
  }, [name, slugTouched, setValue]);

  const resetState = (): void => {
    reset({ slug: "", name: "", description: "" });
    setSlugTouched(false);
    setServerSlugError(null);
  };

  const isDirty = (): boolean => {
    const v = getValues();
    return Boolean(v.name?.trim() || v.description?.trim());
  };

  const onOpenChange = (next: boolean): void => {
    if (!next && isDirty()) {
      if (!window.confirm("Hủy project đang tạo?")) return;
    }
    if (!next) resetState();
    setOpen(next);
  };

  const onSubmit = (values: CreateProjectRequest): void => {
    setServerSlugError(null);
    mutation.mutate(
      {
        ...values,
        description: values.description?.trim() ? values.description.trim() : undefined,
      },
      {
        onSuccess: (project) => {
          setOpen(false);
          resetState();
          navigate(`/projects/${project.slug}`);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === "PROJECT_SLUG_TAKEN") {
            setServerSlugError(err.message || "Slug đã được dùng, chọn slug khác");
          }
        },
      },
    );
  };

  const slugError = serverSlugError ?? formState.errors.slug?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {customTrigger ?? (
          <Button variant="default" size="sm">
            <Plus className="mr-2 size-4" aria-hidden="true" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo project</DialogTitle>
          <DialogDescription>Khởi tạo catalog cho dự án mới.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="cpd-name">Tên project *</Label>
              <Input
                id="cpd-name"
                autoFocus
                aria-invalid={!!formState.errors.name || undefined}
                aria-describedby={formState.errors.name ? "cpd-name-error" : undefined}
                {...register("name")}
              />
              {formState.errors.name && (
                <p id="cpd-name-error" role="alert" className="text-xs text-destructive">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpd-slug">Slug *</Label>
              <Input
                id="cpd-slug"
                aria-invalid={!!slugError || undefined}
                aria-describedby={slugError ? "cpd-slug-error" : "cpd-slug-hint"}
                {...register("slug", {
                  onChange: () => {
                    setSlugTouched(true);
                    setServerSlugError(null);
                  },
                })}
              />
              {slugError ? (
                <p id="cpd-slug-error" role="alert" className="text-xs text-destructive">
                  {slugError}
                </p>
              ) : (
                <p id="cpd-slug-hint" className="text-xs text-muted-foreground">
                  URL-friendly, auto-điền từ tên.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpd-desc">Mô tả (tùy chọn)</Label>
              <Textarea id="cpd-desc" rows={3} {...register("description")} />
              {formState.errors.description && (
                <p role="alert" className="text-xs text-destructive">
                  {formState.errors.description.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending || undefined}
            >
              <Plus className="mr-2 size-4" aria-hidden="true" />
              Tạo project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
