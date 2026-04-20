import type { PropsWithChildren, ReactNode } from "react";
import clsx from "clsx";

interface AppCardProps extends PropsWithChildren {
  title?: string;
  extra?: ReactNode;
  className?: string;
  variant?: "default" | "expressive";
}

export const AppCard = ({ title, extra, className, variant = "default", children }: AppCardProps) => (
  <section
    className={clsx(
      variant === "expressive"
        ? "community-surface rounded-[36px] border border-white/60 p-4 dark:border-white/10 sm:p-5 lg:p-6"
        : "rounded-[28px] border border-slate-200/70 bg-white/78 p-4 shadow-panel backdrop-blur-xl transition dark:border-white/8 dark:bg-slate-950/72 sm:p-5 lg:p-6",
      className
    )}
  >
    {(title || extra) && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {title ? (
          <h3 className="text-base font-semibold tracking-[0.01em] text-slate-950 dark:!text-slate-50">
            {title}
          </h3>
        ) : (
          <span />
        )}
        {extra}
      </div>
    )}
    {children}
  </section>
);
