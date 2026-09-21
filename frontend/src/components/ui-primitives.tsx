import type { ReactNode } from "react";

export const panelHeadingClass =
  "max-w-[42rem] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.052em]";

export const panelCopyClass =
  "max-w-[42rem] text-[0.95rem] leading-[1.7] text-[var(--muted)]";

export const fieldControlClass =
  "w-full rounded-xl border border-[var(--line-strong)] bg-white text-[var(--ink)] shadow-[inset_0_1px_2px_rgb(31_38_52_/_4%)] outline-none transition-[border-color,box-shadow] placeholder:text-[#949dac] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgb(103_92_245_/_12%)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] disabled:cursor-not-allowed disabled:opacity-60";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--accent-deep)] bg-[var(--accent)] px-[1.15rem] text-sm font-semibold text-white shadow-[0_5px_14px_rgb(81_70_220_/_20%)] outline-none transition-[background-color,border-color,box-shadow,transform] hover:bg-[var(--accent-deep)] hover:shadow-[0_7px_18px_rgb(81_70_220_/_25%)] focus-visible:border-[var(--focus)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-[1.15rem] text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-control)] outline-none transition-[background-color,border-color,box-shadow,transform] hover:border-[#b5bdca] hover:bg-[#fafbfc] focus-visible:border-[var(--focus)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50";

export function LoadingOrbit() {
  return (
    <span
      className="relative mx-auto block size-12 rounded-full border border-[var(--line)] before:absolute before:-inset-px before:rounded-full before:border-2 before:border-transparent before:border-t-[var(--accent)] before:content-[''] before:animate-spin after:absolute after:top-1/2 after:left-1/2 after:size-[0.55rem] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-[var(--accent)] after:shadow-[0_0_16px_rgb(103_92_245_/_50%)] after:content-['']"
      aria-hidden="true"
    />
  );
}

type StateOrbProps = {
  children: ReactNode;
  danger?: boolean;
  className?: string;
};

export function StateOrb({ children, danger = false, className = "" }: StateOrbProps) {
  return (
    <span
      className={`mx-auto grid size-14 place-items-center rounded-2xl border text-[1.35rem] font-bold shadow-[0_12px_30px_rgb(81_70_220_/_12%)] ${
        danger
          ? "border-[rgb(200_76_90_/_18%)] bg-[#fff0f2] text-[var(--danger)] shadow-[0_12px_30px_rgb(200_76_90_/_10%)]"
          : "border-[rgb(103_92_245_/_18%)] bg-[var(--accent-soft)] text-[var(--accent-deep)]"
      } ${className}`}
    >
      {children}
    </span>
  );
}
