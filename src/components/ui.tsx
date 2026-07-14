import { clsx } from "clsx";
import type { RequestStatus } from "@/lib/domain/types";

export function StatusPill({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
    submitted: { label: "Submitted", className: "bg-sky-100 text-sky-700" },
    in_review: { label: "In Review", className: "bg-sky-100 text-sky-700" },
    info_requested: { label: "Info Requested", className: "bg-amber-100 text-amber-800" },
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
    approved_conditional: { label: "Approved (Conditions)", className: "bg-amber-100 text-amber-800" },
    denied: { label: "Denied", className: "bg-rose-100 text-rose-700" },
    auto_approved: { label: "Auto-Approved", className: "bg-emerald-100 text-emerald-700" },
  };
  const { label, className } = map[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function DueChip({ label, urgency }: { label: string; urgency: "ok" | "warn" | "bad" | "none" }) {
  if (urgency === "none") return <span className="text-xs text-slate-400">{label}</span>;
  const className = {
    ok: "text-slate-500",
    warn: "text-amber-700",
    bad: "text-rose-700",
  }[urgency];
  return <span className={clsx("text-xs font-mono", className)}>{label}</span>;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    ghost: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "border border-rose-300 text-rose-700 hover:bg-rose-50",
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}

export function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {helper && <span className="mt-1 block text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-lg border border-slate-200 bg-white p-6 shadow-sm", className)}>{children}</div>;
}

export function FlagRow({ flag }: { flag: { type: string; citation: string; description: string } }) {
  const style =
    flag.type === "government_violation"
      ? { dot: "bg-rose-600", label: "Blocked — city/state code" }
      : flag.type === "hoa_conflict"
      ? { dot: "bg-amber-500", label: "HOA note" }
      : { dot: "bg-sky-500", label: "Reminder" };
  return (
    <div className="flex gap-3 border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
      <span className={clsx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
      <div>
        <div className="text-sm font-semibold text-slate-800">
          {style.label} <span className="font-normal text-slate-400">— {flag.citation}</span>
        </div>
        <div className="text-sm text-slate-600">{flag.description}</div>
      </div>
    </div>
  );
}
