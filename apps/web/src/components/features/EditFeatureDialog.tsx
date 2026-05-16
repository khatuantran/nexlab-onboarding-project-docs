import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { updateFeatureRequestSchema, type UpdateFeatureRequest } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { useUpdateFeature } from "@/queries/projects";
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

interface EditFeatureDialogProps {
  projectSlug: string;
  feature: { slug: string; title: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called with the new slug when slug change persisted. Caller is
   * responsible for navigating (decouples hook from router).
   */
  onSlugChange?: (newSlug: string) => void;
}

export function EditFeatureDialog({
  projectSlug,
  feature,
  open,
  onOpenChange,
  onSlugChange,
}: EditFeatureDialogProps): JSX.Element {
  const mutation = useUpdateFeature(projectSlug, feature.slug);

  const form = useForm<UpdateFeatureRequest>({
    resolver: zodResolver(updateFeatureRequestSchema),
    defaultValues: { title: feature.title, slug: feature.slug },
    mode: "onSubmit",
  });

  const { register, handleSubmit, reset, getValues, formState, setError } = form;

  useEffect(() => {
    if (open) {
      reset({ title: feature.title, slug: feature.slug });
    }
  }, [open, feature.title, feature.slug, reset]);

  const isDirty = (): boolean => {
    const v = getValues();
    return (
      (v.title ?? "").trim() !== feature.title.trim() ||
      (v.slug ?? "").trim() !== feature.slug.trim()
    );
  };

  const handleOpenChange = (next: boolean): void => {
    if (!next && isDirty() && !mutation.isPending) {
      if (!window.confirm("Hủy chỉnh sửa feature?")) return;
    }
    onOpenChange(next);
  };

  const onSubmit = (values: UpdateFeatureRequest): void => {
    const payload: UpdateFeatureRequest = {};
    const newTitle = values.title?.trim();
    const newSlug = values.slug?.trim();
    if (newTitle && newTitle !== feature.title) payload.title = newTitle;
    if (newSlug && newSlug !== feature.slug) payload.slug = newSlug;

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }

    mutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Đã cập nhật feature");
        onOpenChange(false);
        if (payload.slug && payload.slug !== feature.slug) {
          onSlugChange?.(data.slug);
        }
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          setError("slug", { message: "Slug đã có trong project này" });
        } else if (err instanceof ApiError && err.status >= 500) {
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
          <DialogTitle>Sửa feature</DialogTitle>
          <DialogDescription>Cập nhật tên và slug của feature.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="efd-title">Tiêu đề *</Label>
              <Input
                id="efd-title"
                autoFocus
                aria-invalid={!!formState.errors.title || undefined}
                aria-describedby={formState.errors.title ? "efd-title-error" : undefined}
                {...register("title")}
              />
              {formState.errors.title && (
                <p id="efd-title-error" role="alert" className="text-xs text-destructive">
                  {formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="efd-slug">Slug *</Label>
              <Input
                id="efd-slug"
                aria-invalid={!!formState.errors.slug || undefined}
                aria-describedby="efd-slug-hint"
                {...register("slug")}
              />
              <p id="efd-slug-hint" className="text-xs text-muted-foreground">
                Lowercase, dấu gạch ngang, 3-60 ký tự. Đổi slug = URL cũ ngừng hoạt động.
              </p>
              {formState.errors.slug && (
                <p role="alert" className="text-xs text-destructive">
                  {formState.errors.slug.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              aria-busy={mutation.isPending || undefined}
            >
              <Check className="mr-2 size-4" aria-hidden="true" />
              {mutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
