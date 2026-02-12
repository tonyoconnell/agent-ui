import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Envelope {
  id: string;
  action: string;
  inputs: Record<string, unknown>;
  payloadStatus: string;
  callbackPointer?: string;
}

interface EnvelopeCardProps {
  envelope: Envelope;
  className?: string;
}

export function EnvelopeCard({ envelope, className }: EnvelopeCardProps) {
  return (
    <Card className={cn("bg-[#0a0a0f] border-[#1e293b]", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 text-slate-400"
          >
            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
          </svg>
          <CardTitle className="text-sm font-mono text-slate-200">
            {envelope.id}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between">
          <span className="text-xs text-slate-500">Action</span>
          <span className="text-xs font-mono text-slate-300">
            {envelope.action}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Inputs</span>
          <pre className="text-xs font-mono text-slate-300 bg-[#0f0f17] p-2 rounded overflow-x-auto">
            {JSON.stringify(envelope.inputs, null, 2)}
          </pre>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Payload Status</span>
          <span className="text-xs font-mono text-slate-300">
            {envelope.payloadStatus}
          </span>
        </div>
        {envelope.callbackPointer && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Callback</span>
            <span className="text-xs font-mono text-slate-400">
              {envelope.callbackPointer}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
