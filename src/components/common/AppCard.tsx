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
      "rounded-[28px] border border-slate-200/70 bg-white/78 p-4 shadow-panel backdrop-blur-xl transition dark:border-white/8 dark:bg-slate-950/72 sm:p-5 lg:p-6",
      className
    )}
  >
    {(title || extra) && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {title ? <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3> : <span />}
        {extra}
      </div>
    )}
    {children}
  </section>
);
