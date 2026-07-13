import { cn } from "@/lib/utils";

export function StatusPill({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-slate-100 text-slate-600",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {children}
    </span>
  );
}
