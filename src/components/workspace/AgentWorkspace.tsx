// Agent Workspace - Animated with Tabs
// 1. Agent grid with hover effects
// 2. Opens in tabs - multiple agents can be open
// 3. Three-column flow with animations

import { useEffect, useState } from "react";
import { Runtime, DeterministicAgent, createEnvelope } from "@/engine";
import { cn } from "@/lib/utils";
import { EnvelopeFlowCanvas } from "@/components/flow/EnvelopeFlowCanvas";

// Setup
function createSampleAgents() {
  const agentA = new DeterministicAgent("agent-a", "Data Processor", {
    processData: () => ({ processed: true, count: 42 }),
    validate: () => ({ valid: true }),
  });

  const agentB = new DeterministicAgent("agent-b", "Router", {
    routeEnvelope: (inputs) => ({ routed: true, target: (inputs as { target?: string }).target }),
  });

  const agentC = new DeterministicAgent("agent-c", "Validator", {
    signPayload: () => ({ signed: true, hash: "0xabc..." }),
  });

  return { agentA, agentB, agentC };
}

function createEnvelopeChain() {
  const callback2 = createEnvelope({
    action: "signPayload",
    inputs: { payload: "{{ results }}" },
    sender: "agent-b",
    receiver: "agent-c",
    callback: null,
  });

  const callback1 = createEnvelope({
    action: "routeEnvelope",
    inputs: { target: "agent-c", data: "{{ results }}" },
    sender: "agent-a",
    receiver: "agent-b",
    callback: callback2,
  });

  return createEnvelope({
    action: "processData",
    inputs: { source: "api/feed", limit: 100 },
    sender: "system",
    receiver: "agent-a",
    callback: callback1,
  });
}

// Animated status dot
function StatusDot({ status, animate = false }: { status: string; animate?: boolean }) {
  const color = {
    ready: "bg-green-500",
    waiting: "bg-amber-500",
    idle: "bg-slate-500",
    resolved: "bg-green-500",
    pending: "bg-amber-500",
  }[status] || "bg-slate-500";

  return (
    <span className="relative flex h-2 w-2">
      {animate && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} />
      )}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", color)} />
    </span>
  );
}

// ============================================
// Tab Bar
// ============================================
function TabBar({
  tabs,
  activeTab,
  onSelect,
  onClose,
  onHome
}: {
  tabs: { id: string; name: string; status: string }[];
  activeTab: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onHome: () => void;
}) {
  return (
    <div className="flex items-center bg-[#0f0f17] border-b border-[#1e293b] px-2">
      {/* Home/Agents tab */}
      <button
        onClick={onHome}
        className={cn(
          "px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
          activeTab === null
            ? "text-white border-blue-500"
            : "text-slate-500 border-transparent hover:text-slate-300"
        )}
      >
        Agents
      </button>

      {/* Open agent tabs */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px cursor-pointer",
            activeTab === tab.id
              ? "text-white border-blue-500"
              : "text-slate-500 border-transparent hover:text-slate-300"
          )}
          onClick={() => onSelect(tab.id)}
        >
          <StatusDot status={tab.status} />
          <span>{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.id);
            }}
            className="ml-1 w-4 h-4 flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-700 rounded transition-all opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Agent Grid (Animated)
// ============================================
function AgentGrid({
  agents,
  openTabs,
  onSelect
}: {
  agents: DeterministicAgent[];
  openTabs: string[];
  onSelect: (id: string) => void;
}) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl animate-fadeIn">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-white mb-2 tracking-tight">Agents</h1>
          <p className="text-slate-500 text-sm">Select an agent to view its execution flow</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {agents.map((agent, index) => {
            const isOpen = openTabs.includes(agent.id);

            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
                className={cn(
                  "group relative bg-[#161622] border rounded-2xl p-6 sm:p-8 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20",
                  isOpen
                    ? "border-blue-500/50 hover:border-blue-400"
                    : "border-[#252538] hover:border-slate-500"
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "slideUp 0.5s ease-out forwards",
                  opacity: 0,
                }}
              >
                {/* Glow effect on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl transition-opacity duration-300",
                  "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
                  hoveredAgent === agent.id ? "opacity-100" : "opacity-0"
                )} />

                {/* Open indicator */}
                {isOpen && (
                  <div className="absolute top-3 right-3 text-xs text-blue-400">Open</div>
                )}

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <StatusDot status={agent.status} animate={hoveredAgent === agent.id} />
                    <span className="text-white font-medium text-lg">{agent.name}</span>
                  </div>

                  <div className="text-slate-500 text-xs mb-6 font-mono">
                    {Object.keys(agent.actions).map((action, i) => (
                      <span key={action}>
                        {action}
                        {i < Object.keys(agent.actions).length - 1 && (
                          <span className="text-slate-600 mx-1">•</span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 text-sm transition-all duration-300",
                    hoveredAgent === agent.id ? "text-white" : "text-slate-600"
                  )}>
                    <span>{agent.envelopes.length} envelope{agent.envelopes.length !== 1 ? "s" : ""}</span>
                    <span className={cn(
                      "transition-transform duration-300",
                      hoveredAgent === agent.id ? "translate-x-1" : ""
                    )}>→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}


// ============================================
// Flow View (Tab Content) - Uses ReactFlow Canvas
// ============================================
function FlowView({ agent }: { agent: DeterministicAgent }) {
  const envelope = agent.envelopes[0] || null;

  // Transform envelope to the format expected by EnvelopeFlowCanvas
  const envelopeData = envelope ? {
    id: envelope.id,
    action: envelope.env.action,
    inputs: envelope.env.inputs as Record<string, unknown>,
    results: envelope.payload.results as Record<string, unknown> | undefined,
    status: envelope.payload.status,
    callback: envelope.callback ? {
      id: envelope.callback.id,
      action: envelope.callback.env.action,
      inputs: envelope.callback.env.inputs as Record<string, unknown>,
      receiver: envelope.callback.metadata?.receiver,
    } : null,
  } : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#252538]">
        <StatusDot status={agent.status} animate />
        <h2 className="text-lg font-medium text-white">{agent.name}</h2>
        <span className="text-slate-500 text-sm font-mono">
          {Object.keys(agent.actions).join(", ")}
        </span>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1">
        <EnvelopeFlowCanvas envelope={envelopeData} />
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function AgentWorkspace() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [agents, setAgents] = useState<DeterministicAgent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Tab state
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized) return;

    const init = async () => {
      const rt = new Runtime();
      const { agentA, agentB, agentC } = createSampleAgents();

      rt.registerAgent(agentA);
      rt.registerAgent(agentB);
      rt.registerAgent(agentC);

      await rt.send(createEnvelopeChain());

      setRuntime(rt);
      setAgents([agentA, agentB, agentC]);
      setIsInitialized(true);
    };

    init();
  }, [isInitialized]);

  const openAgent = (id: string) => {
    if (!openTabs.includes(id)) {
      setOpenTabs([...openTabs, id]);
    }
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    const newTabs = openTabs.filter(t => t !== id);
    setOpenTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  if (!runtime || agents.length === 0) {
    return (
      <div className="h-screen bg-[#0f0f17] flex items-center justify-center">
        <div className="text-slate-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  const tabs = openTabs.map(id => {
    const agent = agents.find(a => a.id === id);
    return { id, name: agent?.name || id, status: agent?.status || "idle" };
  });

  const activeAgent = activeTab ? agents.find(a => a.id === activeTab) : null;

  return (
    <div className="h-screen bg-[#0f0f17] flex flex-col overflow-hidden">
      {/* Tab bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onClose={closeTab}
        onHome={() => setActiveTab(null)}
      />

      {/* Content */}
      {activeTab && activeAgent ? (
        <FlowView agent={activeAgent} />
      ) : (
        <AgentGrid agents={agents} openTabs={openTabs} onSelect={openAgent} />
      )}
    </div>
  );
}
