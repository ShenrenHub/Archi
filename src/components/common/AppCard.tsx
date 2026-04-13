import type { PropsWithChildren, ReactNode } from "react";
import clsx from "clsx";

interface AppCardProps extends PropsWithChildren {
  title?: string;
  extra?: ReactNode;
  className?: string;
}

export const AppCard = ({ title, extra, className, children }: AppCardProps) => (
  <section
    className={clsx(
      "rounded-[28px] border border-white/10 bg-white/70 p-5 shadow-panel backdrop-blur-xl transition dark:border-white/5 dark:bg-slate-900/60",
      className
    )}
  >
    {(title || extra) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title ? <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3> : <span />}
        {extra}
      </div>
    )}
    {children}
  </section>
);
