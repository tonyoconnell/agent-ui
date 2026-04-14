/**
 * POST /api/signal — Route a signal through the substrate
 *
 * Body: { sender: string, receiver: string, data?: string, amount?: number, task?: string }
 *
 * Full loop:
 *   1. Write signal to TypeDB
 *   2. suggest_route() → best agent for task
 *   3. Execute agent (if LLM-backed: model + system-prompt)
 *   4. Write result signal
 *   5. mark() on success / warn() on failure
 */
import type { APIRoute } from 'astro'
import { markOutcome, type RouteChoice } from '@/engine/llm-router'
import { getNet } from '@/lib/net'
import { resolveUnit, send as suiSend } from '@/lib/sui'
import { readParsed, write, writeSilent } from '@/lib/typedb'

/** Validate UID format (alphanumeric, hyphens, colons only) */
function validateUid(uid: string): boolean {
  return /^[a-zA-Z0-9:_-]+$/.test(uid) && uid.length > 0 && uid.length <= 255
}

/** Escape TQL string values */
function escapeTqlString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

export const POST: APIRoute = async ({ request }) => {
  const {
    sender,
    receiver,
    data,
    amount = 0,
    task,
  } = (await request.json()) as {
    sender: string
    receiver: string
    data?: string
    task?: string
    amount?: number
  }

  if (!sender || !receiver) {
    return new Response(JSON.stringify({ error: 'Missing sender or receiver' }), { status: 400 })
  }

  // Validate UIDs to prevent TQL injection
  if (!validateUid(sender)) {
    return new Response(JSON.stringify({ error: 'Invalid sender format' }), { status: 400 })
  }
  if (!validateUid(receiver)) {
    return new Response(JSON.stringify({ error: 'Invalid receiver format' }), { status: 400 })
  }
  if (task && !validateUid(task)) {
    return new Response(JSON.stringify({ error: 'Invalid task format' }), { status: 400 })
  }

  // Validate amount
  if (typeof amount !== 'number' || amount < 0 || amount > 1_000_000) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
  }

  const dataStr = data ? escapeTqlString(data).slice(0, 10000) : ''
  const now = new Date().toISOString().replace('Z', '')
  const start = Date.now()

  try {
    // 1. Record the inbound signal
    await write(`
      match
        $from isa unit, has uid "${sender}";
        $to isa unit, has uid "${receiver}";
      insert
        (sender: $from, receiver: $to) isa signal,
          has data "${dataStr}",
          has amount ${amount},
          has success true,
          has ts ${now};
    `)

    // 2. If task specified, ask TypeDB for best route
    let routed: string | null = null
    let result: string | null = null

    if (task) {
      const escapedTask = escapeTqlString(task)
      const routes = await readParsed(`
        match
          $from isa unit, has uid "${receiver}";
          $sk isa skill, has name $sn; $sn contains "${escapedTask}";
          (source: $from, target: $to) isa path, has strength $s;
          (provider: $to, offered: $sk) isa capability;
          $to has uid $id; $s >= 5.0;
        sort $s desc; limit 1;
        select $id, $s;
      `).catch(() => [])

      if (routes.length > 0) {
        routed = routes[0].id as string
      }
    }

    // 3. Execute agent if it has model + system-prompt
    const target = routed || receiver
    const agentInfo = await readParsed(`
      match $u isa unit, has uid "${target}", has model $m, has system-prompt $sp;
      select $m, $sp;
    `).catch(() => [])

    if (agentInfo.length > 0) {
      const model = agentInfo[0].m as string
      const systemPrompt = agentInfo[0].sp as string
      const prompt = data || 'No input provided'

      // All models route through OpenRouter (OpenAI-compatible API)
      const apiKey = import.meta.env.OPENROUTER_API_KEY || ''

      // Map agent model names to OpenRouter model IDs
      const orModel = model.includes('/')
        ? model // already namespaced
        : 'meta-llama/llama-4-maverick' // default: 1M ctx, $0.15/M tokens, leading open model

      if (apiKey) {
        const tModel = Date.now()
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://one.ie',
              'X-Title': 'ONE Substrate',
            },
            body: JSON.stringify({
              model: orModel,
              max_tokens: 4096,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
              ],
            }),
          })
          if (!res.ok) {
            console.error('OpenRouter error:', res.status, await res.text().then((t) => t.slice(0, 300)))
            result = null
          } else {
            const d = (await res.json()) as { choices: Array<{ message: { content: string } }> }
            result = d.choices?.[0]?.message?.content || null
          }
        } catch (err) {
          console.error('OpenRouter fetch failed:', err instanceof Error ? err.message : err)
          result = null
        }

        // Accumulate pheromone on the tag→model edge. Authorial model choice
        // is preserved (no routing override); only the outcome is learned.
        try {
          const net = await getNet()
          const tag = task || 'default'
          const choice: RouteChoice = {
            model: { id: orModel, costPerMToken: 0 },
            reason: 'pheromone',
            edge: `${tag}→${orModel}`,
            estimatedCost: 0,
          }
          markOutcome(net, choice, {
            response: result ?? undefined,
            failure: result === null ? true : undefined,
            quality: result ? (result.length > 40 ? 0.7 : 0.4) : 0,
            latencyMs: Date.now() - tModel,
          })
        } catch {
          // getNet() not available or write races — pheromone mark is fire-and-forget
        }
      }
    }

    const latency = Date.now() - start
    const success = result !== null

    // 4. Write result signal if we got one
    if (result && routed) {
      const resultNow = new Date().toISOString().replace('Z', '')
      const resultStr = escapeTqlString(result.slice(0, 10000))
      writeSilent(`
        match
          $from isa unit, has uid "${routed}";
          $to isa unit, has uid "${sender}";
        insert
          (sender: $from, receiver: $to) isa signal,
            has data "${resultStr}",
            has amount 0,
            has success true,
            has latency ${latency}.0,
            has ts ${resultNow};
      `)
    }

    // 5. Strengthen or warn the path
    if (success) {
      // mark() — strengthen path
      await write(`
        match
          $from isa unit, has uid "${sender}";
          $to isa unit, has uid "${receiver}";
          $e (source: $from, target: $to) isa path,
            has strength $s, has traversals $t, has revenue $r;
        delete $s of $e; delete $t of $e; delete $r of $e;
        insert
          $e has strength ($s + 1.0),
            has traversals ($t + 1),
            has revenue ($r + ${amount});
      `).catch(() => {
        return write(`
          match
            $from isa unit, has uid "${sender}";
            $to isa unit, has uid "${receiver}";
          insert
            (source: $from, target: $to) isa path,
              has strength 1.0, has resistance 0.0,
              has traversals 1, has revenue ${amount};
        `)
      })
    } else {
      // warn() — add resistance
      writeSilent(`
        match
          $from isa unit, has uid "${sender}";
          $to isa unit, has uid "${receiver}";
          $e (source: $from, target: $to) isa path, has resistance $r;
        delete $r of $e;
        insert $e has resistance ($r + 1.0);
      `)
    }

    // 6. Push path changes to KV (fire and forget — keeps edge routing fresh)
    const syncUrl = import.meta.env.SYNC_WORKER_URL || 'https://one-sync.oneie.workers.dev'
    fetch(`${syncUrl}/sync`, { method: 'POST' }).catch(() => {})

    // 7. Mirror to Sui (if configured — fire and forget)
    let suiDigest: string | null = null
    try {
      const senderUnit = await resolveUnit(sender)
      const receiverUnit = await resolveUnit(target)
      if (senderUnit?.wallet && receiverUnit?.wallet) {
        const enc = new TextEncoder()
        const payload = data ? enc.encode(data.slice(0, 1000)) : new Uint8Array()
        const { digest } = await suiSend(
          sender,
          senderUnit.objectId,
          receiverUnit.objectId,
          receiverUnit.wallet,
          task || 'default',
          payload,
          amount,
        )
        suiDigest = digest
      }
    } catch {
      // Sui not configured or tx failed — TypeDB signal still recorded
    }

    return new Response(
      JSON.stringify({
        ok: true,
        routed,
        result: result?.slice(0, 500),
        latency,
        success,
        sui: suiDigest,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
