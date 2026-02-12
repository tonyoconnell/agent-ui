// Agent Workspace - Animated with Tabs
// 1. Agent grid with hover effects
// 2. Opens in tabs - multiple agents can be open
// 3. Three-column flow with animations

import { useEffect, useState } from "react";
import { Runtime, DeterministicAgent, createEnvelope } from "@/engine";
import type { Envelope } from "@/engine";
import { cn } from "@/lib/utils";

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
          <h1 className="text-3xl font-light text-white mb-2 tracking-tight">Envelope System</h1>
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
// Expandable JSON Field
// ============================================
function JsonField({ label, data, variant = "default" }: { label: string; data: unknown; variant?: "default" | "success" }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const isLong = json.length > 50;

  return (
    <div>
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <button
        onClick={() => isLong && setExpanded(!expanded)}
        className={cn(
          "w-full text-left font-mono text-xs p-2 sm:p-3 rounded-lg transition-all duration-200",
          "bg-[#0f0f17] border border-transparent overflow-x-auto",
          isLong && "hover:border-slate-700 cursor-pointer",
          variant === "success" ? "text-green-400" : "text-slate-400"
        )}
      >
        <pre className={cn("overflow-hidden transition-all duration-300 whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal", expanded ? "max-h-96" : "max-h-16")}>
          {json}
        </pre>
        {isLong && !expanded && <span className="text-slate-600 text-xs">Click to expand...</span>}
      </button>
    </div>
  );
}

// ============================================
// Envelope Column (Animated)
// ============================================
function EnvelopeColumn({
  envelope,
  label,
  delay = 0,
  isActive = false
}: {
  envelope: Envelope | null;
  label: string;
  delay?: number;
  isActive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex-1 bg-[#161622] border rounded-2xl p-4 sm:p-6 lg:min-h-[400px] transition-all duration-500",
        isActive ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-[#252538]"
      )}
      style={{
        animationDelay: `${delay}ms`,
        animation: "slideIn 0.6s ease-out forwards",
        opacity: 0,
      }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        {envelope && (
          <div className="flex items-center gap-2">
            <StatusDot status={envelope.payload.status} animate={isActive} />
            <span className="text-xs text-slate-500">{envelope.payload.status}</span>
          </div>
        )}
      </div>

      {!envelope ? (
        <div className="text-slate-600 text-sm flex items-center justify-center h-32 lg:h-64">No envelope</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <div className="text-slate-500 text-xs mb-1">ID</div>
            <code className="text-slate-300 font-mono text-xs sm:text-sm break-all">{envelope.id}</code>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Action</div>
            <div className="text-white font-semibold text-lg sm:text-xl">{envelope.env.action}</div>
          </div>
          <JsonField label="Inputs" data={envelope.env.inputs} />
          {envelope.payload.results && <JsonField label="Results" data={envelope.payload.results} variant="success" />}
          {envelope.callback && (
            <div className="pt-4 border-t border-[#252538]">
              <div className="text-slate-500 text-xs mb-1">Chains to</div>
              <div className="text-slate-400 font-mono text-sm flex items-center gap-2">
                <span className="text-blue-400">{envelope.callback.env.action}</span>
                <span className="text-slate-600">→</span>
                <span className="text-slate-500">{envelope.callback.metadata?.receiver}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Logic Column (Animated)
// ============================================
function LogicColumn({ delay = 0, activeStep = -1 }: { delay?: number; activeStep?: number }) {
  const steps = [
    { code: "const { action, inputs } = envelope.env;", comment: "// Extract" },
    { code: "let result = await this.actions[action](inputs);", comment: "// Execute" },
    { code: "envelope.payload.results = result;", comment: "// Store" },
    { code: "if (callback) {", comment: "" },
    { code: "  this.substitute(callback, result);", comment: "// Substitute" },
    { code: "  await this.route(callback);", comment: "// Route" },
    { code: "}", comment: "" },
  ];

  return (
    <div
      className="flex-1 bg-[#161622] border border-[#252538] rounded-2xl p-4 sm:p-6 lg:min-h-[400px]"
      style={{
        animationDelay: `${delay}ms`,
        animation: "slideIn 0.6s ease-out forwards",
        opacity: 0,
      }}
    >
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-4 sm:mb-6">Logic</div>
      <div className="space-y-1 sm:space-y-2 font-mono text-xs sm:text-sm overflow-x-auto">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 py-1 px-2 rounded transition-all duration-300",
              activeStep === i && "bg-blue-500/10 border-l-2 border-blue-500"
            )}
          >
            <span className={cn("transition-colors duration-300", activeStep === i ? "text-white" : "text-slate-400")}>
              {step.code}
            </span>
            {step.comment && <span className="text-slate-600 text-xs">{step.comment}</span>}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Animated Arrow (responsive - horizontal on lg, vertical on small)
// ============================================
function ColumnArrow({ delay = 0, active = false }: { delay?: number; active?: boolean }) {
  return (
    <div
      className="flex items-center justify-center w-full lg:w-12 py-2 lg:py-0"
      style={{
        animationDelay: `${delay}ms`,
        animation: "fadeIn 0.4s ease-out forwards",
        opacity: 0,
      }}
    >
      {/* Horizontal arrow for large screens */}
      <svg
        className={cn("hidden lg:block w-8 h-8 transition-all duration-300", active ? "text-blue-400 scale-110" : "text-slate-600")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      {/* Vertical arrow for small screens */}
      <svg
        className={cn("lg:hidden w-6 h-6 transition-all duration-300", active ? "text-blue-400 scale-110" : "text-slate-600")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Flow View (Tab Content)
// ============================================
function FlowView({ agent }: { agent: DeterministicAgent }) {
  const envelope = agent.envelopes[0] || null;
  const callback = envelope?.callback || null;

  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const runAnimation = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveStep(0);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= 7) {
        clearInterval(interval);
        setTimeout(() => {
          setActiveStep(-1);
          setIsAnimating(false);
        }, 1000);
      } else {
        setActiveStep(i);
      }
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <StatusDot status={agent.status} animate />
          <h2 className="text-lg font-medium text-white">{agent.name}</h2>
          <span className="text-slate-500 text-sm font-mono hidden sm:inline">
            {Object.keys(agent.actions).join(", ")}
          </span>
        </div>

        <button
          onClick={runAnimation}
          disabled={isAnimating}
          className={cn(
            "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 w-full sm:w-auto",
            isAnimating
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105"
          )}
        >
          {isAnimating ? "Running..." : "▶ Run Flow"}
        </button>
      </div>

      {/* Three columns - vertical on mobile, horizontal on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-4 items-stretch lg:items-start">
        <EnvelopeColumn envelope={envelope} label="Envelope" delay={0} isActive={activeStep >= 0 && activeStep <= 2} />
        <ColumnArrow delay={200} active={activeStep >= 0 && activeStep <= 2} />
        <LogicColumn delay={300} activeStep={activeStep} />
        <ColumnArrow delay={400} active={activeStep >= 4} />
        <EnvelopeColumn envelope={callback} label="Callback" delay={500} isActive={activeStep >= 4} />
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
