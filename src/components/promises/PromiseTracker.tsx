import { cn } from "@/lib/utils";
import { PromiseRow, type PromiseInfo } from "./PromiseRow";

interface PromiseTrackerProps {
  promises: PromiseInfo[];
  label?: string;
  className?: string;
}

export function PromiseTracker({ promises, label, className }: PromiseTrackerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <h3 className="text-sm font-medium text-slate-200">{label}</h3>
      )}
      <div className="space-y-2">
        {promises.map((promise) => (
          <PromiseRow key={promise.id} promise={promise} />
        ))}
        {promises.length === 0 && (
          <div className="text-xs text-slate-500 py-4 text-center">
            No promises to display
          </div>
        )}
      </div>
    </div>
  );
}
