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
import { write, readParsed, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { sender, receiver, data, amount = 0, task } = await request.json() as {
    sender: string
    receiver: string
    data?: string
    task?: string
    amount?: number
  }

  if (!sender || !receiver) {
    return new Response(JSON.stringify({ error: 'Missing sender or receiver' }), { status: 400 })
  }

  const dataStr = data ? JSON.stringify(data).replace(/"/g, '\\"') : ''
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
      const routes = await readParsed(`
        match
          $from isa unit, has uid "${receiver}";
          $sk isa skill, has name $sn; $sn contains "${task}";
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

      // Execute via Anthropic (default) or OpenAI
      const apiKey = model.startsWith('gpt')
        ? (import.meta.env.OPENAI_API_KEY || '')
        : (import.meta.env.ANTHROPIC_API_KEY || '')

      if (apiKey) {
        try {
          if (model.startsWith('gpt')) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: prompt },
                ],
              }),
            })
            const d = await res.json() as { choices: Array<{ message: { content: string } }> }
            result = d.choices[0].message.content
          } else {
            const claudeModel = model === 'opus' ? 'claude-opus-4-20250514'
              : model === 'haiku' ? 'claude-haiku-4-5-20251001'
              : 'claude-sonnet-4-20250514'
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'content-type': 'application/json',
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: claudeModel,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
              }),
            })
            const d = await res.json() as { content: Array<{ text: string }> }
            result = d.content[0].text
          }
        } catch {
          // LLM call failed — alarm the path
          result = null
        }
      }
    }

    const latency = Date.now() - start
    const success = result !== null

    // 4. Write result signal if we got one
    if (result && routed) {
      const resultNow = new Date().toISOString().replace('Z', '')
      const resultStr = result.slice(0, 10000).replace(/"/g, '\\"').replace(/\n/g, '\\n')
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

    // 5. Strengthen or alarm the path
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
              has strength 1.0, has alarm 0.0,
              has traversals 1, has revenue ${amount};
        `)
      })
    } else {
      // warn() — add resistance
      writeSilent(`
        match
          $from isa unit, has uid "${sender}";
          $to isa unit, has uid "${receiver}";
          $e (source: $from, target: $to) isa path, has alarm $a;
        delete $a of $e;
        insert $e has alarm ($a + 1.0);
      `)
    }

    return new Response(JSON.stringify({
      ok: true,
      routed,
      result: result?.slice(0, 500),
      latency,
      success,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
