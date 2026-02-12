import { cn } from "@/lib/utils";
import { EnvelopeCard, type Envelope } from "./EnvelopeCard";

interface EnvelopeListProps {
  envelopes: Envelope[];
  label?: string;
  className?: string;
}

export function EnvelopeList({ envelopes, label, className }: EnvelopeListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <h3 className="text-sm font-medium text-slate-200">{label}</h3>
      )}
      <div className="space-y-2">
        {envelopes.map((envelope) => (
          <EnvelopeCard key={envelope.id} envelope={envelope} />
        ))}
        {envelopes.length === 0 && (
          <div className="text-xs text-slate-500 py-4 text-center">
            No envelopes to display
          </div>
        )}
      </div>
    </div>
  );
}
