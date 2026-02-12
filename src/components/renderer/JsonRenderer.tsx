import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCard, type Agent } from "@/components/agents/AgentCard";
import { PromiseTracker } from "@/components/promises/PromiseTracker";
import { EnvelopeList } from "@/components/envelopes/EnvelopeList";
import { LogicViewer } from "@/components/logic/LogicViewer";
import type { PromiseInfo } from "@/components/promises/PromiseRow";
import type { Envelope } from "@/components/envelopes/EnvelopeCard";

// UISchema type definitions
export type UINodeType =
  | "page"
  | "tabbed-panel"
  | "panel"
  | "section"
  | "agent-info"
  | "promise-tracker"
  | "envelope-list"
  | "logic-viewer";

export interface UISchemaBase {
  type: UINodeType;
  label?: string;
  className?: string;
}

export interface PageSchema extends UISchemaBase {
  type: "page";
  children: UISchema[];
}

export interface TabbedPanelSchema extends UISchemaBase {
  type: "tabbed-panel";
  tabs: {
    id: string;
    label: string;
    content: UISchema;
  }[];
  defaultTab?: string;
}

export interface PanelSchema extends UISchemaBase {
  type: "panel";
  children?: UISchema[];
}

export interface SectionSchema extends UISchemaBase {
  type: "section";
  children: UISchema[];
}

export interface AgentInfoSchema extends UISchemaBase {
  type: "agent-info";
  agent: Agent;
}

export interface PromiseTrackerSchema extends UISchemaBase {
  type: "promise-tracker";
  promises: PromiseInfo[];
}

export interface EnvelopeListSchema extends UISchemaBase {
  type: "envelope-list";
  envelopes: Envelope[];
}

export interface LogicViewerSchema extends UISchemaBase {
  type: "logic-viewer";
  code: string;
}

export type UISchema =
  | PageSchema
  | TabbedPanelSchema
  | PanelSchema
  | SectionSchema
  | AgentInfoSchema
  | PromiseTrackerSchema
  | EnvelopeListSchema
  | LogicViewerSchema;

interface JsonRendererProps {
  schema: UISchema;
  className?: string;
}

export function JsonRenderer({ schema, className }: JsonRendererProps) {
  switch (schema.type) {
    case "page":
      return (
        <div
          className={cn(
            "flex flex-col gap-4 bg-[#0a0a0f] min-h-screen p-4",
            schema.className,
            className
          )}
        >
          {schema.children.map((child, index) => (
            <JsonRenderer key={index} schema={child} />
          ))}
        </div>
      );

    case "tabbed-panel":
      return (
        <Tabs
          defaultValue={schema.defaultTab || schema.tabs[0]?.id}
          className={cn("w-full", schema.className, className)}
        >
          <TabsList className="bg-[#0f0f17] border border-[#1e293b]">
            {schema.tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-[#1e293b] data-[state=active]:text-slate-200"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {schema.tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <JsonRenderer schema={tab.content} />
            </TabsContent>
          ))}
        </Tabs>
      );

    case "panel":
      return (
        <Card
          className={cn(
            "bg-[#0a0a0f] border-[#1e293b]",
            schema.className,
            className
          )}
        >
          {schema.label && (
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-200">
                {schema.label}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className={cn(!schema.label && "pt-4")}>
            {schema.children?.map((child, index) => (
              <JsonRenderer key={index} schema={child} />
            ))}
          </CardContent>
        </Card>
      );

    case "section":
      return (
        <div className={cn("space-y-4", schema.className, className)}>
          {schema.label && (
            <h2 className="text-lg font-semibold text-slate-200">
              {schema.label}
            </h2>
          )}
          {schema.children.map((child, index) => (
            <JsonRenderer key={index} schema={child} />
          ))}
        </div>
      );

    case "agent-info":
      return (
        <AgentCard
          agent={schema.agent}
          className={cn(schema.className, className)}
        />
      );

    case "promise-tracker":
      return (
        <PromiseTracker
          promises={schema.promises}
          label={schema.label}
          className={cn(schema.className, className)}
        />
      );

    case "envelope-list":
      return (
        <EnvelopeList
          envelopes={schema.envelopes}
          label={schema.label}
          className={cn(schema.className, className)}
        />
      );

    case "logic-viewer":
      return (
        <LogicViewer
          code={schema.code}
          label={schema.label}
          className={cn(schema.className, className)}
        />
      );

    default:
      // Exhaustive check
      const _exhaustive: never = schema;
      return null;
  }
}
