/**
 * ORG TREE — Collapsible hierarchy of groups and agents
 *
 * STREAM 3: Left Rail component for /world page
 * Shows ONE → [teams] → [agents] with expandable tree structure
 * Click agent to set ?focus=<id>. Click group to expand/collapse.
 *
 * Data sources:
 * - GET /api/export/groups.json
 * - GET /api/export/units.json
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Unit {
  id: string
  name: string
  model: string
  successRate: number
  group?: string
}

interface Group {
  id: string
  name: string
  type: string
  color?: string
  members: string[] // Unit IDs
}

interface TreeNode {
  id: string
  name: string
  type: 'group' | 'unit'
  isRoot?: boolean
  children?: TreeNode[]
  unit?: Unit
  group?: Group
}

interface OrgTreeProps {
  className?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get icon for agent based on model
 * opus → 🧠, sonnet → 🎯, haiku → ⚡
 */
function getModelIcon(model: string): string {
  const modelLower = model.toLowerCase()
  if (modelLower.includes('opus')) return '🧠'
  if (modelLower.includes('sonnet')) return '🎯'
  if (modelLower.includes('haiku')) return '⚡'
  return '⚙️'
}

/**
 * Format success rate as badge text
 */
function formatSuccessRate(rate: number): string {
  return `✓ ${Math.round(rate)}%`
}

/**
 * Build tree structure from groups and units
 */
function buildTree(groups: Group[], units: Unit[]): TreeNode {
  // Map units by ID for quick lookup
  const unitMap = new Map(units.map((u) => [u.id, u]))
  const groupMap = new Map(groups.map((g) => [g.id, g]))

  // Find root group (ONE or top-level)
  const rootGroup = groups.find((g) => g.id === 'ONE' || g.type === 'root') ||
    groups[0] || { id: 'ONE', name: 'ONE', type: 'root', members: [] }

  // Build tree recursively
  function buildNode(groupId: string, visited = new Set<string>()): TreeNode {
    if (visited.has(groupId)) {
      return { id: groupId, name: '...', type: 'group' }
    }
    visited.add(groupId)

    const group = groupMap.get(groupId)
    if (!group) {
      return { id: groupId, name: groupId, type: 'group' }
    }

    // Separate members into subgroups and units
    const children: TreeNode[] = []

    // Add subgroups (groups whose parent is this group)
    for (const [id, _g] of groupMap) {
      // Check if this is a child of current group (by naming convention or explicit parent)
      if (id !== groupId && id.startsWith(`${groupId}:`)) {
        const childNode = buildNode(id, visited)
        if (childNode) children.push(childNode)
      }
    }

    // Add units in this group
    for (const memberId of group.members) {
      const unit = unitMap.get(memberId)
      if (unit) {
        children.push({
          id: memberId,
          name: unit.name,
          type: 'unit',
          unit,
        })
      }
    }

    return {
      id: groupId,
      name: group.name,
      type: 'group',
      group,
      children,
      isRoot: groupId === 'ONE' || groupId === rootGroup.id,
    }
  }

  return buildNode(rootGroup.id)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TreeNodeProps {
  node: TreeNode
  level: number
  expandedGroups: Set<string>
  onToggleGroup: (id: string) => void
  focusedId?: string
  onFocusAgent: (id: string) => void
}

function TreeNodeComponent({ node, level, expandedGroups, onToggleGroup, focusedId, onFocusAgent }: TreeNodeProps) {
  const isExpanded = expandedGroups.has(node.id)
  const isFocused = focusedId === node.id

  if (node.type === 'group') {
    const hasChildren = node.children && node.children.length > 0

    return (
      <div className="select-none">
        {/* Group header */}
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors',
            'hover:bg-slate-800/50 text-sm',
            isFocused && 'bg-slate-700 text-white font-semibold',
          )}
          style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
          onClick={() => hasChildren && onToggleGroup(node.id)}
        >
          {/* Expand/collapse arrow */}
          {hasChildren ? (
            <span className={cn('text-xs w-4 text-slate-500 transition-transform', isExpanded && 'rotate-90')}>▶</span>
          ) : (
            <span className="w-4" />
          )}

          {/* Group name (bold) */}
          <span className="font-semibold flex-1 truncate text-slate-200">{node.name}</span>

          {/* Member count badge */}
          {hasChildren && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {node.children!.filter((c) => c.type === 'unit').length}
            </Badge>
          )}
        </div>

        {/* Children (expanded) */}
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                expandedGroups={expandedGroups}
                onToggleGroup={onToggleGroup}
                focusedId={focusedId}
                onFocusAgent={onFocusAgent}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Unit (agent) node
  const unit = node.unit!
  const icon = getModelIcon(unit.model)
  const successText = formatSuccessRate(unit.successRate)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors',
        'hover:bg-slate-800/50 text-sm',
        isFocused && 'bg-slate-700 text-white font-semibold shadow-[0_0_12px_rgba(59,130,246,0.4)]',
      )}
      style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      onClick={() => onFocusAgent(unit.id)}
    >
      {/* Model icon */}
      <span className="text-base w-4 flex-shrink-0">{icon}</span>

      {/* Agent name */}
      <span className="flex-1 truncate text-slate-300">{unit.name}</span>

      {/* Success rate badge */}
      <Badge
        variant="outline"
        className={cn(
          'text-xs px-1.5 py-0 flex-shrink-0',
          unit.successRate >= 90 && 'border-green-600/50 text-green-400',
          unit.successRate >= 75 && unit.successRate < 90 && 'border-yellow-600/50 text-yellow-400',
          unit.successRate < 75 && 'border-red-600/50 text-red-400',
        )}
      >
        {successText}
      </Badge>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="p-3 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          {i % 2 === 0 && (
            <>
              <Skeleton className="h-7 w-2/3 ml-4" />
              <Skeleton className="h-7 w-2/3 ml-4" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════════

function ErrorState() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-2">Unable to load org</p>
        <p className="text-slate-600 text-xs">Check the API endpoints</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function OrgTree({ className }: OrgTreeProps) {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['ONE']))
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined)

  // Read focus from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const id = params.get('focus') || undefined
    setFocusedId(id)
  }, [])

  // Fetch data on mount
  useEffect(() => {
    async function fetchWithTimeout(url: string, timeout = 3000): Promise<Response | null> {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)
      try {
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(id)
        return res
      } catch {
        clearTimeout(id)
        return null
      }
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch groups and units in parallel (3s timeout each)
        const [groupsRes, unitsRes] = await Promise.all([
          fetchWithTimeout('/api/export/groups.json', 3000),
          fetchWithTimeout('/api/export/units.json', 3000),
        ])

        if (!groupsRes?.ok || !unitsRes?.ok) {
          throw new Error('Failed to fetch org data')
        }

        const groups: Group[] = await groupsRes.json()
        const units: Unit[] = await unitsRes.json()

        // Build tree
        const rootTree = buildTree(groups, units)
        setTree(rootTree)

        // Auto-expand focused node's ancestors
        if (focusedId) {
          const newExpanded = new Set(expandedGroups)
          // Find all parent groups of focused unit
          const findParents = (node: TreeNode, parents: Set<string>): boolean => {
            if (node.type === 'group' && node.children) {
              for (const child of node.children) {
                if (child.id === focusedId) {
                  parents.add(node.id)
                  return true
                }
                if (findParents(child, parents)) {
                  parents.add(node.id)
                  return true
                }
              }
            }
            return false
          }
          findParents(rootTree, newExpanded)
          setExpandedGroups(newExpanded)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organization')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [focusedId, expandedGroups])

  // Handlers
  function handleToggleGroup(groupId: string) {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  function handleFocusAgent(unitId: string) {
    // Update URL with ?focus=<id>
    const newParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    newParams.set('focus', unitId)
    window.history.replaceState({}, '', `?${newParams.toString()}`)
    // Notify sibling components (AgentCard listens for this)
    window.dispatchEvent(new CustomEvent('world:focus', { detail: { id: unitId } }))
  }

  // Render
  if (loading) {
    return (
      <div className={cn('h-full bg-slate-900 border-r border-slate-800 overflow-hidden flex flex-col', className)}>
        <LoadingState />
      </div>
    )
  }

  if (error || !tree) {
    return (
      <div className={cn('h-full bg-slate-900 border-r border-slate-800 overflow-hidden flex flex-col', className)}>
        <ErrorState />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-full bg-slate-900 border-r border-slate-800 overflow-y-auto overflow-x-hidden flex flex-col',
        className,
      )}
    >
      {/* Header */}
      <div className="sticky top-0 px-3 py-2 bg-slate-900/95 border-b border-slate-800 backdrop-blur-sm z-10">
        <h3 className="text-sm font-semibold text-slate-300">Organization</h3>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        <TreeNodeComponent
          node={tree}
          level={0}
          expandedGroups={expandedGroups}
          onToggleGroup={handleToggleGroup}
          focusedId={focusedId}
          onFocusAgent={handleFocusAgent}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~300 lines. Collapsible org tree. Left rail.
// ═══════════════════════════════════════════════════════════════════════════════
