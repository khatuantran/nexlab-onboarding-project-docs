import { CheckCircle2, Clock, FolderOpen, Users } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { DecorativeMark } from "@/components/common/DecorativeMark";
import { FloatStat } from "@/components/common/FloatStat";

/**
 * Right brand panel of LoginPage (xl≥1280px only) per login.md spec.
 * v1 placeholder: hardcoded stat numbers + testimonial. No real
 * backend dashboard query.
 */
export function LoginBrandPanel(): JSX.Element {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-[#FFF8EE] via-[#FDEED7] to-[#FBDAAD] xl:flex dark:from-primary-100/45 dark:via-primary-50/55 dark:to-primary-200/35"
    >
      <DecorativeMark size={520} className="absolute -right-16 -top-16" />

      {/* Floating stat collage */}
      <FloatStat
        icon={FolderOpen}
        tone="primary"
        value="42"
        label="Active projects"
        delta="+3 tuần này"
        className="absolute left-14 top-32"
      />
      <FloatStat
        icon={Users}
        tone="info"
        value="18"
        label="Engineers onboarded"
        delta="2 đang làm việc"
        className="absolute left-72 top-56"
      />
      <FloatStat
        icon={CheckCircle2}
        tone="success"
        value="86%"
        label="Tỉ lệ feature có doc"
        delta="+12% so với Q1"
        className="absolute left-20 top-[28rem]"
      />
      <FloatStat
        icon={Clock}
        tone="warning"
        value="2.3h"
        label="Time-to-onboard"
        delta="↓ 45 phút"
        className="absolute left-80 top-[32rem]"
      />

      {/* Testimonial */}
      <div className="absolute bottom-9 left-14 right-14 rounded-2xl bg-white/78 p-6 ring-1 ring-white/60 backdrop-blur-md dark:bg-card/85 dark:ring-border">
        <div className="mb-2.5 flex items-center gap-3">
          <Avatar name="Ngọc Linh" size="md" />
          <div>
            <p className="font-ui text-[13px] font-semibold text-foreground">
              Ngọc Linh · Senior Dev
            </p>
            <p className="mt-1 font-ui text-[11px] leading-snug text-muted-foreground">
              Onboard ngày 14/03/2026
            </p>
          </div>
        </div>
        <p className="font-body text-sm italic leading-5 text-foreground/80">
          "Trang này giúp mình hiểu nghiệp vụ trong 2 ngày — trước đây mất cả tuần đi hỏi từng
          người."
        </p>
      </div>
    </aside>
  );
}
