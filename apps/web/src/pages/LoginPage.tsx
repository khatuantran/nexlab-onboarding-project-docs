import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginRequestSchema, type LoginRequest } from "@onboarding/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { messageForCode } from "@/lib/errorMessages";
import { NxLogo } from "@/components/common/NxLogo";
import { useLogin, useMe } from "@/queries/auth";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const { data: me } = useMe();
  const login = useLogin();

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

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-10 flex justify-center">
        <NxLogo size={48} />
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Đăng nhập</h1>
      <p className="mt-2 font-ui text-sm text-muted-foreground">
        Dùng tài khoản nội bộ để xem tài liệu onboarding.
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={errors.email ? "true" : undefined}
            {...register("email")}
          />
          {errors.email?.message ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : undefined}
            {...register("password")}
          />
          {errors.password?.message ? (
            <p className="text-xs text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={isSubmitting || login.isPending} className="mt-2">
          {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </main>
  );
}
