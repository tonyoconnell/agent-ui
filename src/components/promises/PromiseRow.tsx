import { cn } from "@/lib/utils";

export type PromiseStatus = "resolved" | "pending" | "idle" | "rejected";

export interface PromiseInfo {
  id: string;
  label: string;
  status: PromiseStatus;
}

interface PromiseRowProps {
  promise: PromiseInfo;
  className?: string;
}

const statusColors: Record<PromiseStatus, string> = {
  resolved: "bg-green-500",
  pending: "bg-amber-500",
  idle: "bg-slate-500",
  rejected: "bg-red-500",
};

const statusLabels: Record<PromiseStatus, string> = {
  resolved: "Resolved",
  pending: "Pending",
  idle: "Idle",
  rejected: "Rejected",
};

export function PromiseRow({ promise, className }: PromiseRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-3 bg-[#0a0a0f] border border-[#1e293b] rounded-lg",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-2 w-2 rounded-full flex-shrink-0",
            statusColors[promise.status]
          )}
        />
        <span className="text-xs font-mono text-slate-400">{promise.id}</span>
        <span className="text-sm text-slate-300">{promise.label}</span>
      </div>
      <span className="text-xs text-slate-500">
        {statusLabels[promise.status]}
      </span>
    </div>
  );
}
