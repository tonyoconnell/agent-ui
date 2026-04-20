/**
 * useNodeLayout — dagre layout wrapper, parameterized.
 *
 * Extracted from PheromoneGraph.tsx / OrgChart.tsx applyLayout().
 * Same dagre; call sites control rankdir + node dims.
 */

import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import { useMemo } from 'react'

export interface NodeLayoutOpts {
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL'
  nodesep?: number
  ranksep?: number
  nodeW?: number
  nodeH?: number
}

export function useNodeLayout(nodes: Node[], edges: Edge[], opts: NodeLayoutOpts = {}): Node[] {
  const { rankdir = 'TB', nodesep = 52, ranksep = 80, nodeW = 184, nodeH = 80 } = opts

  return useMemo(() => {
    if (nodes.length === 0) return nodes
    try {
      const g = new dagre.graphlib.Graph()
      g.setGraph({ rankdir, nodesep, ranksep })
      g.setDefaultEdgeLabel(() => ({}))
      for (const n of nodes) g.setNode(n.id, { width: nodeW, height: nodeH })
      for (const e of edges) g.setEdge(e.source, e.target)
      dagre.layout(g)
      return nodes.map((n) => {
        const pos = g.node(n.id)
        if (!pos) return n
        return { ...n, position: { x: pos.x - nodeW / 2, y: pos.y - nodeH / 2 } }
      })
    } catch {
      return nodes
    }
  }, [nodes, edges, rankdir, nodesep, ranksep, nodeW, nodeH])
}
