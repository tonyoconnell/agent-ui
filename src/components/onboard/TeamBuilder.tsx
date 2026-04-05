/**
 * TeamBuilder — Create a team of AI agents with wired signal flow
 *
 * 1. Name the group
 * 2. Add agents (name, task, model)
 * 3. Wire the flow (who emits to whom)
 * 4. Write a brief to kick it off
 *
 * Maps to DSL: group() → actor() → flow() → signal()
 */

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Agent {
  name: string
  task: string
  emitsTo: string  // "name:task" or empty for terminal
  model: string
}

interface TeamResult {
  ok?: boolean
  group?: string
  agents?: string[]
  error?: string
}

const MODELS = ['haiku', 'sonnet', 'opus']

const TEMPLATES: Record<string, { description: string; agents: Agent[] }> = {
  marketing: {
    description: 'Plan, write, review, publish',
    agents: [
      { name: 'strategist', task: 'plan', emitsTo: 'copywriter:write', model: 'sonnet' },
      { name: 'copywriter', task: 'write', emitsTo: 'reviewer:review', model: 'sonnet' },
      { name: 'reviewer', task: 'review', emitsTo: 'publisher:publish', model: 'haiku' },
      { name: 'publisher', task: 'publish', emitsTo: '', model: 'haiku' },
    ],
  },
  research: {
    description: 'Scout, analyze, synthesize, report',
    agents: [
      { name: 'scout', task: 'observe', emitsTo: 'analyst:process', model: 'sonnet' },
      { name: 'analyst', task: 'process', emitsTo: 'synthesizer:combine', model: 'opus' },
      { name: 'synthesizer', task: 'combine', emitsTo: 'reporter:summarize', model: 'sonnet' },
      { name: 'reporter', task: 'summarize', emitsTo: '', model: 'haiku' },
    ],
  },
  engineering: {
    description: 'Design, build, test, deploy',
    agents: [
      { name: 'architect', task: 'design', emitsTo: 'builder:build', model: 'opus' },
      { name: 'builder', task: 'build', emitsTo: 'tester:test', model: 'sonnet' },
      { name: 'tester', task: 'test', emitsTo: 'deployer:deploy', model: 'haiku' },
      { name: 'deployer', task: 'deploy', emitsTo: '', model: 'haiku' },
    ],
  },
  support: {
    description: 'Triage, investigate, resolve, follow up',
    agents: [
      { name: 'triage', task: 'classify', emitsTo: 'investigator:investigate', model: 'haiku' },
      { name: 'investigator', task: 'investigate', emitsTo: 'resolver:resolve', model: 'sonnet' },
      { name: 'resolver', task: 'resolve', emitsTo: 'followup:check', model: 'sonnet' },
      { name: 'followup', task: 'check', emitsTo: '', model: 'haiku' },
    ],
  },
}

export function TeamBuilder() {
  const [teamName, setTeamName] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [brief, setBrief] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TeamResult | null>(null)

  // New agent form
  const [agentName, setAgentName] = useState('')
  const [agentTask, setAgentTask] = useState('')
  const [agentEmitsTo, setAgentEmitsTo] = useState('')
  const [agentModel, setAgentModel] = useState('sonnet')

  const addAgent = () => {
    if (!agentName || !agentTask) return
    const clean = agentName.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (agents.some(a => a.name === clean)) return
    setAgents([...agents, {
      name: clean,
      task: agentTask.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      emitsTo: agentEmitsTo,
      model: agentModel,
    }])
    setAgentName('')
    setAgentTask('')
    setAgentEmitsTo('')
    setAgentModel('sonnet')
  }

  const removeAgent = (index: number) => {
    const removed = agents[index]
    setAgents(agents.filter((_, i) => i !== index).map(a => {
      // Clear emitsTo references to the removed agent
      if (a.emitsTo.startsWith(removed.name + ':') || a.emitsTo === removed.name) {
        return { ...a, emitsTo: '' }
      }
      return a
    }))
  }

  const applyTemplate = (key: string) => {
    const t = TEMPLATES[key]
    setAgents(t.agents)
    if (!teamName) setTeamName(key)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName || agents.length < 2) return
    setResult(null)

    startTransition(async () => {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, agents, brief: brief || undefined }),
      })
      const data = await res.json() as TeamResult
      setResult(data)
    })
  }

  // Build the chain for preview
  const chainPreview = () => {
    if (agents.length === 0) return null
    // Find the entry point (agent not referenced by any emitsTo)
    const targets = new Set(agents.map(a => a.name))
    for (const a of agents) {
      if (a.emitsTo) {
        const targetName = a.emitsTo.includes(':') ? a.emitsTo.split(':')[0] : a.emitsTo
        targets.delete(targetName)
      }
    }
    // Walk the chain from entry points
    const visited = new Set<string>()
    const chains: string[][] = []
    for (const entry of targets) {
      const chain: string[] = []
      let current: string | undefined = entry
      while (current && !visited.has(current)) {
        visited.add(current)
        const agent = agents.find(a => a.name === current)
        if (!agent) break
        chain.push(`${agent.name}:${agent.task}`)
        if (!agent.emitsTo) break
        current = agent.emitsTo.includes(':') ? agent.emitsTo.split(':')[0] : agent.emitsTo
      }
      if (chain.length > 0) chains.push(chain)
    }
    // Any agents not in a chain
    for (const a of agents) {
      if (!visited.has(a.name)) {
        chains.push([`${a.name}:${a.task}`])
      }
    }
    return chains
  }

  const chains = chainPreview()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Build a Team
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          group + actors + flow + signal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Team Name */}
        <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">1. Name the group</h2>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="marketing, research, engineering..."
            required
            className="bg-[#0f0f17] border-[#353548] text-white placeholder:text-slate-600 h-11 font-mono"
          />

          {/* Templates */}
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Or start from a template:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className="rounded-lg border border-[#353548] bg-[#0f0f17] px-3 py-2 text-left transition-colors hover:border-violet-500/50 hover:bg-violet-500/5"
                >
                  <span className="block text-sm font-medium text-white">{key}</span>
                  <span className="block text-xs text-slate-500">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Add Agents */}
        <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">2. Add agents</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Agent name</label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="strategist"
                className="bg-[#0f0f17] border-[#353548] text-white placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Task</label>
              <Input
                value={agentTask}
                onChange={(e) => setAgentTask(e.target.value)}
                placeholder="plan"
                className="bg-[#0f0f17] border-[#353548] text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Emits to</label>
              {agents.length > 0 ? (
                <select
                  value={agentEmitsTo}
                  onChange={(e) => setAgentEmitsTo(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#353548] bg-[#0f0f17] px-3 text-sm text-white"
                >
                  <option value="">— end of chain —</option>
                  {agents.map((a) => (
                    <option key={a.name} value={`${a.name}:${a.task}`}>
                      {a.name}:{a.task}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={agentEmitsTo}
                  onChange={(e) => setAgentEmitsTo(e.target.value)}
                  placeholder="next-agent:task (or leave empty)"
                  className="bg-[#0f0f17] border-[#353548] text-white placeholder:text-slate-600"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Model</label>
              <select
                value={agentModel}
                onChange={(e) => setAgentModel(e.target.value)}
                className="h-9 w-full rounded-md border border-[#353548] bg-[#0f0f17] px-3 text-sm text-white"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="button"
            onClick={addAgent}
            disabled={!agentName || !agentTask}
            variant="outline"
            className="w-full border-dashed border-[#353548] text-slate-400 hover:text-white hover:border-violet-500"
          >
            + Add agent
          </Button>
        </div>

        {/* Agent List */}
        {agents.length > 0 && (
          <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              Agents <span className="text-slate-500 text-sm font-normal">({agents.length})</span>
            </h2>

            <div className="space-y-2">
              {agents.map((agent, i) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between rounded-lg border border-[#353548] bg-[#0f0f17] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono text-white">{agent.name}</span>
                    <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-xs">
                      {agent.task}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-500 text-xs">
                      {agent.model}
                    </Badge>
                    {agent.emitsTo && (
                      <span className="text-xs text-slate-500">
                        → <span className="text-emerald-400 font-mono">{agent.emitsTo}</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAgent(i)}
                    className="text-slate-500 hover:text-red-400 transition-colors text-sm ml-2 shrink-0"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Flow Preview */}
        {chains && chains.length > 0 && (
          <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">3. Signal flow</h2>
            <div className="space-y-3">
              {chains.map((chain, ci) => (
                <div key={ci} className="flex items-center gap-2 flex-wrap font-mono text-sm">
                  {chain.map((node, ni) => (
                    <span key={node} className="flex items-center gap-2">
                      {ni > 0 && <span className="text-violet-500">→</span>}
                      <span className="rounded bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-violet-300">
                        {node}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Pheromone accumulates on each edge. Paths that work become highways.
            </p>
          </div>
        )}

        {/* 4. Brief */}
        <div className="rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">4. First signal</h2>
          <p className="text-sm text-slate-400">
            The brief that starts the chain. Sent to the first agent.
          </p>
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Q2 product launch campaign for developer tools..."
            rows={3}
            className="bg-[#0f0f17] border-[#353548] text-white placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!teamName || agents.length < 2 || isPending}
          className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white"
        >
          {isPending
            ? 'Creating team...'
            : `Deploy ${teamName || 'team'} (${agents.length} agents)`
          }
        </Button>

        {/* Result */}
        {result?.ok && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
            <p className="text-emerald-400 font-medium text-lg">Team deployed</p>
            <p className="text-sm text-slate-400">
              Group: <span className="font-mono text-white">{result.group}</span>
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {result.agents?.map(a => (
                <Badge key={a} variant="outline" className="border-emerald-500/30 text-emerald-400">
                  {a}
                </Badge>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-sm">
              <a href="/world" className="text-violet-400 hover:text-violet-300 transition-colors">
                View world
              </a>
              <a href="/tasks" className="text-violet-400 hover:text-violet-300 transition-colors">
                View tasks
              </a>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-red-400 font-medium">{result.error}</p>
          </div>
        )}
      </form>

      {/* DSL Preview */}
      {agents.length >= 2 && (
        <div className="mt-8 rounded-xl border border-[#252538] bg-[#161622] p-6 space-y-3">
          <h3 className="text-sm font-medium text-slate-500">DSL equivalent</h3>
          <pre className="text-xs font-mono text-slate-400 overflow-x-auto leading-relaxed">
{`const w = world({ persist: typedb() })

w.group('${teamName}', 'team')

${agents.map(a =>
  `w.actor('${a.name}', 'agent', { group: '${teamName}', model: '${a.model}' })
  .on('${a.task}', (data, emit) => {${a.emitsTo ? `
    emit({ receiver: '${a.emitsTo}', data: result })` : `
    return result`}
  })`
).join('\n\n')}
${agents.filter(a => a.emitsTo).map(a => {
  const target = a.emitsTo.includes(':') ? a.emitsTo.split(':')[0] : a.emitsTo
  return `w.flow('${a.name}', '${target}', { group: '${teamName}' }).strengthen()`
}).join('\n')}
${brief ? `
w.signal({ receiver: '${agents[0].name}:${agents[0].task}', data: { brief: '...' } })` : ''}`}
          </pre>
        </div>
      )}

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-slate-500">
        <a href="/build" className="hover:text-violet-400 transition-colors">Build single agent</a>
        <span>|</span>
        <a href="/discover" className="hover:text-violet-400 transition-colors">Discover agents</a>
        <span>|</span>
        <a href="/world" className="hover:text-violet-400 transition-colors">View world</a>
      </div>
    </div>
  )
}
