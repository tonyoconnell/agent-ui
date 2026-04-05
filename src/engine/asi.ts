/**
 * ASI — Routing intelligence
 *
 * Three-tier: substrate → TypeDB → LLM.
 * Exploration scales inversely with confidence.
 */

import type { Colony } from './substrate'
import { readParsed, writeSilent } from '@/lib/typedb'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export type ASI = {
  orchestrate: (task: string, data: unknown, from?: string) => Promise<{ agent: string; result: unknown }>
  confidence: (taskType: string) => number
}

export const asi = (net: Colony, complete: Complete): ASI => {
  const confidence = (taskType: string): number => {
    const trails = net.highways(50).filter(h => h.path.includes(`→${taskType}→`))
    return trails.length ? Math.min(1, trails[0].strength / 50) : 0
  }

  const orchestrate = async (task: string, data: unknown, from = 'user') => {
    const taskType = task.split(' ')[0].toLowerCase()

    const agent = net.select(taskType, 1 - confidence(taskType))
      || await readParsed(`
          match (source: $from, target: $to) isa path, has strength $s;
                $from isa unit, has uid "${from}";
                (provider: $to, offered: $sk) isa capability;
                $sk isa skill, has skill-id "${taskType}"; $to has uid $id;
          sort $s desc; limit 1; select $id;
        `).then(r => (r[0]?.id as string) || null).catch(() => null)
      || (await complete(`Route "${task}" to: ${net.list().join(', ')}. Name only.`)).trim()

    net.mark(`${from}→${taskType}→${agent}`, 0.5)

    // Load prompt + price from TypeDB
    const meta = await readParsed(
      `match $u isa unit, has uid "${agent}", has system-prompt $sp;
       optional { (provider: $u, offered: $sk) isa capability, has price $p; };
       select $sp, $p;`
    ).then(r => ({ system: r[0]?.sp as string | undefined, price: (r[0]?.p as number) || 0 }))
      .catch(() => ({ system: undefined as string | undefined, price: 0 }))

    const result = await net.ask(
      { receiver: agent, data: { ...(data as object), system: meta.system } }, from
    )
    // L4: revenue flows on success — capability price becomes path revenue
    if (result !== undefined) {
      net.mark(`${from}→${taskType}→${agent}`, 1)
      meta.price > 0 && writeSilent(`
        match $from isa unit, has uid "${from}"; $to isa unit, has uid "${agent}";
        $e (source: $from, target: $to) isa path, has revenue $r;
        delete $r of $e; insert $e has revenue ($r + ${meta.price});
      `)
    } else {
      net.warn(`${from}→${taskType}→${agent}`, 1)
    }

    return { agent, result }
  }

  return { orchestrate, confidence }
}
