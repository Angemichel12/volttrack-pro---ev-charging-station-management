import React from "react";
import { IconClose } from "./Icons";

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card: React.FC<{
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}> = ({ title, actions, children, className = "", padded = true }) => (
  <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden ${className}`}>
    {(title || actions) && (
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        {title && <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h3>}
        {actions}
      </div>
    )}
    <div className={padded ? "p-4 sm:p-6" : ""}>{children}</div>
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  tone?: "default" | "green" | "red";
}> = ({ label, value, icon, sub, tone = "default" }) => {
  const valueColor =
    tone === "green" ? "text-green-700" : tone === "red" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <p className="text-xs font-medium text-gray-500 leading-snug">{label}</p>
      </div>
      <p className={`mt-3 text-xl sm:text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

// ─── PageHeader ───────────────────────────────────────────────────────────────

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────────

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  }
> = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-gray-300 text-gray-600 hover:bg-gray-50",
    ghost: "text-gray-500 hover:bg-gray-100",
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ─── Form controls ────────────────────────────────────────────────────────────

const controlClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500/60 focus:border-green-500 outline-none transition-all";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }> = ({
  label,
  hint,
  className = "",
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <input className={`${controlClass} ${className}`} {...props} />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({
  label,
  className = "",
  children,
  ...props
}) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <select className={`${controlClass} ${className}`} {...props}>
      {children}
    </select>
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: "green" | "red" | "amber" | "gray" | "blue";
  pulse?: boolean;
}> = ({ children, tone = "gray", pulse }) => {
  const tones = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    gray: "bg-gray-100 text-gray-500",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tones[tone]} ${pulse ? "animate-pulse" : ""}`}
    >
      {children}
    </span>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, hint, action, className = "" }) => (
  <div className={`text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-300 ${className}`}>
    {icon && <div className="mx-auto w-11 h-11 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">{icon}</div>}
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    {hint && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{hint}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

// ─── Loading ──────────────────────────────────────────────────────────────────

export const Loading: React.FC<{ label?: string }> = ({ label = "Tegereza..." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <svg className="animate-spin w-7 h-7 text-green-600 mb-3" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <p className="text-sm">{label}</p>
  </div>
);

// ─── Skeletons ────────────────────────────────────────────────────────────────

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

// Placeholder rows shown while a table's data is loading.
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  // Vary cell widths so the placeholder reads as a table, not stripes.
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-3/5", "w-2/5"];
  return (
    <div aria-hidden>
      <div className="flex gap-4 pb-3 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton className={`h-2.5 ${widths[i % widths.length]}`} />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3.5 border-b border-gray-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1">
              <Skeleton className={`h-3 ${widths[(r + c) % widths.length]}`} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const StatSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-5" aria-hidden>
    <div className="flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
    <Skeleton className="mt-4 h-6 w-2/3" />
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
// Bottom sheet on small screens, centered dialog on larger ones.

export const Modal: React.FC<{ open: boolean; onClose: () => void; title?: string; children: React.ReactNode }> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Table helpers (consistent, scrollable on mobile) ─────────────────────────

export const Table: React.FC<{ headers: React.ReactNode[]; children: React.ReactNode }> = ({ headers, children }) => (
  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
    <table className="w-full min-w-[560px]">
      <thead className="text-left border-b border-gray-100">
        <tr className="text-[11px] text-gray-400 uppercase tracking-wider">
          {headers.map((h, i) => (
            <th key={i} className="pb-3 px-2 font-semibold whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">{children}</tbody>
    </table>
  </div>
);
