import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { createFeatureRequestSchema, type CreateFeatureRequest } from "@onboarding/shared";
import { ApiError } from "@/lib/api";
import { toSlug } from "@/lib/slug";
import { useCreateFeature } from "@/queries/features";
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

interface Props {
  projectSlug: string;
  projectName?: string;
}

/**
 * Author-gated create feature dialog. Mounted on ProjectLandingPage.
 * Parity với CreateProjectDialog: slug auto-derive + sticky, native
 * confirm on dirty-cancel, close + navigate on 201.
 */
export function CreateFeatureDialog({ projectSlug, projectName }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [serverSlugError, setServerSlugError] = useState<string | null>(null);
  const navigate = useNavigate();
  const mutation = useCreateFeature(projectSlug);

  const form = useForm<CreateFeatureRequest>({
    resolver: zodResolver(createFeatureRequestSchema),
    defaultValues: { slug: "", title: "" },
    mode: "onSubmit",
  });

  const { register, handleSubmit, watch, getValues, setValue, reset, formState } = form;
  const title = watch("title");

  useEffect(() => {
    if (!slugTouched) setValue("slug", toSlug(title ?? ""));
  }, [title, slugTouched, setValue]);

  const resetState = (): void => {
    reset({ slug: "", title: "" });
    setSlugTouched(false);
    setServerSlugError(null);
  };

  const isDirty = (): boolean => Boolean(getValues().title?.trim());

  const onOpenChange = (next: boolean): void => {
    if (!next && isDirty()) {
      if (!window.confirm("Hủy feature đang tạo?")) return;
    }
    if (!next) resetState();
    setOpen(next);
  };

  const onSubmit = (values: CreateFeatureRequest): void => {
    setServerSlugError(null);
    mutation.mutate(values, {
      onSuccess: (feature) => {
        setOpen(false);
        resetState();
        navigate(`/projects/${projectSlug}/features/${feature.slug}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.code === "FEATURE_SLUG_TAKEN") {
          setServerSlugError(err.message || "Slug đã được dùng, chọn slug khác");
        }
      },
    });
  };

  const slugError = serverSlugError ?? formState.errors.slug?.message;
  const description = projectName
    ? `Tạo feature mới trong project "${projectName}".`
    : "Tạo feature mới trong project này.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="mr-2 size-4" aria-hidden="true" />
          Thêm feature
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm feature</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-1.5">
              <Label htmlFor="cfd-title">Tiêu đề *</Label>
              <Input
                id="cfd-title"
                autoFocus
                aria-invalid={!!formState.errors.title || undefined}
                aria-describedby={formState.errors.title ? "cfd-title-error" : undefined}
                {...register("title")}
              />
              {formState.errors.title && (
                <p id="cfd-title-error" role="alert" className="text-xs text-destructive">
                  {formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cfd-slug">Slug *</Label>
              <Input
                id="cfd-slug"
                aria-invalid={!!slugError || undefined}
                aria-describedby={slugError ? "cfd-slug-error" : "cfd-slug-hint"}
                {...register("slug", {
                  onChange: () => {
                    setSlugTouched(true);
                    setServerSlugError(null);
                  },
                })}
              />
              {slugError ? (
                <p id="cfd-slug-error" role="alert" className="text-xs text-destructive">
                  {slugError}
                </p>
              ) : (
                <p id="cfd-slug-hint" className="text-xs text-muted-foreground">
                  URL-friendly, auto-điền từ tiêu đề.
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
              Tạo feature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
