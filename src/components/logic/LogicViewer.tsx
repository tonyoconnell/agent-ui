import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LogicViewerProps {
  code: string;
  label?: string;
  className?: string;
}

export function LogicViewer({ code, label, className }: LogicViewerProps) {
  return (
    <Card className={cn("bg-[#0a0a0f] border-[#1e293b]", className)}>
      {label && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">
            {label}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!label && "pt-4")}>
        <div className="bg-[#0f0f17] rounded-lg border border-[#1e293b] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0f] border-b border-[#1e293b]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              agent-logic
            </span>
          </div>
          <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
            {code}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
