import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginRequestSchema, type LoginRequest } from "@onboarding/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { messageForCode } from "@/lib/errorMessages";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";
import { NxLogo } from "@/components/common/NxLogo";
import { useLogin, useMe } from "@/queries/auth";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const { data: me } = useMe();
  const login = useLogin();
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
    shouldFocusError: false,
  });

  useEffect(() => {
    if (me) navigate(next, { replace: true });
  }, [me, next, navigate]);

  const onSubmit = (values: LoginRequest): void => {
    login.mutate(values, {
      onSuccess: () => navigate(next, { replace: true }),
    });
  };

  const serverError = login.error instanceof ApiError ? messageForCode(login.error.code) : null;
  const isPending = isSubmitting || login.isPending;

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left form pane */}
      <main className="flex w-full flex-col bg-background px-6 py-10 sm:px-12 lg:px-16 lg:py-15 xl:w-[540px] xl:flex-shrink-0">
        <div>
          <NxLogo size={32} />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Onboarding Portal
            </p>
            <h1 className="mt-3.5 mb-2 font-display text-[38px] leading-[44px] font-bold tracking-[-0.02em] text-foreground">
              Chào mừng quay lại 👋
            </h1>
            <p className="mb-8 font-body text-[15px] leading-6 text-muted-foreground">
              Dùng tài khoản nội bộ để xem và đóng góp tài liệu onboarding cho các feature đang phát
              triển.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="font-ui text-xs font-semibold text-foreground/80">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="ten.ban@nexlab.vn"
                    aria-invalid={errors.email ? "true" : undefined}
                    className="h-12 pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email?.message ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <Label
                    htmlFor="password"
                    className="font-ui text-xs font-semibold text-foreground/80"
                  >
                    Mật khẩu
                  </Label>
                  <button
                    type="button"
                    onClick={() => toast("Đặt lại mật khẩu: liên hệ admin trong v1")}
                    className="font-ui text-xs font-semibold text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    Quên?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={errors.password ? "true" : undefined}
                    className="h-12 pl-10"
                    {...register("password")}
                  />
                </div>
                {errors.password?.message ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <label className="mt-1 flex items-center gap-2.5 font-ui text-[13px] font-medium text-foreground/80">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((r) => !r)}
                  className={cn(
                    "inline-flex size-[18px] items-center justify-center rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    remember
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background",
                  )}
                >
                  {remember ? (
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  ) : null}
                </button>
                <span onClick={() => setRemember((r) => !r)} className="cursor-pointer select-none">
                  Ghi nhớ tôi 7 ngày
                </span>
              </label>

              {serverError ? (
                <p className="text-sm text-destructive" role="alert">
                  {serverError}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className="mt-3 h-12 w-full shadow-[0_4px_12px_rgba(226,99,20,0.32)]"
              >
                {isPending ? (
                  "Đang đăng nhập…"
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-7 flex items-center gap-3.5">
              <span className="h-px flex-1 bg-border" />
              <span className="font-ui text-xs text-muted-foreground">hoặc</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 w-full"
              onClick={() => toast("Google SSO: tính năng đang phát triển trong v2")}
            >
              <span
                aria-hidden="true"
                className="mr-2.5 inline-flex size-[18px] items-center justify-center rounded-sm border border-border bg-background font-bold text-[11px] text-foreground"
              >
                G
              </span>
              Tiếp tục với Google Workspace
            </Button>

            <p className="mt-7 font-body text-xs text-muted-foreground">
              Chưa có tài khoản? Liên hệ{" "}
              <button
                type="button"
                onClick={() =>
                  toast("Liên hệ admin@nexlab.vn để được cấp quyền truy cập", {
                    duration: 4000,
                  })
                }
                className="font-semibold text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                quản trị viên
              </button>{" "}
              để được cấp quyền truy cập.
            </p>
          </div>
        </div>
      </main>

      <LoginBrandPanel />
    </div>
  );
}
