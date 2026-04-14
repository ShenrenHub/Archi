import type { ReactNode } from "react";
import { AppCard } from "@/components/common/AppCard";

interface StatCardProps {
  title: string;
  value: string;
  suffix?: string;
  icon: ReactNode;
  highlight?: string;
}

export const StatCard = ({ title, value, suffix, icon, highlight }: StatCardProps) => (
  <AppCard className="overflow-hidden">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{value}</span>
          {suffix ? <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{suffix}</span> : null}
        </div>
        {highlight ? (
          <p className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300">
            {highlight}
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 p-3 text-xl text-white shadow-glow">
        {icon}
      </div>
    </div>
  </AppCard>
);
