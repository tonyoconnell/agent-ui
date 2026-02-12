import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AgentStatus = "ready" | "waiting" | "idle" | "error";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  actionCount: number;
}

interface AgentCardProps {
  agent: Agent;
  className?: string;
}

const statusColors: Record<AgentStatus, string> = {
  ready: "bg-green-500",
  waiting: "bg-amber-500",
  idle: "bg-slate-500",
  error: "bg-red-500",
};

const statusLabels: Record<AgentStatus, string> = {
  ready: "Ready",
  waiting: "Waiting",
  idle: "Idle",
  error: "Error",
};

export function AgentCard({ agent, className }: AgentCardProps) {
  return (
    <Card className={cn("bg-[#0a0a0f] border-[#1e293b]", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-200">
            {agent.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                statusColors[agent.status]
              )}
            />
            <span className="text-xs text-slate-400">
              {statusLabels[agent.status]}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Actions</span>
          <Badge variant="secondary" className="text-xs">
            {agent.actionCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
