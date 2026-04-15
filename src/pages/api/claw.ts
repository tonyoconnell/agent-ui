import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = (await request.json()) as {
    name: string
    persona?: string
    telegramToken?: string
    openrouterKey?: string
    groupId?: string
  }

  if (!body.name) {
    return Response.json({ ok: false, error: 'name is required' }, { status: 400 })
  }

  const args = [
    'bun', 'run', 'scripts/setup-nanoclaw.ts',
    '--name', body.name,
    '--persona', body.persona ?? 'one',
  ]

  if (body.telegramToken) {
    args.push('--token', body.telegramToken)
  }

  const env: Record<string, string> = { ...(process.env as Record<string, string>) }
  if (body.openrouterKey) {
    env.OPENROUTER_API_KEY_OVERRIDE = body.openrouterKey
  }

  try {
    const proc = Bun.spawn(args, {
      cwd: process.cwd(),
      env,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      return Response.json({ ok: false, error: stderr || stdout || 'Deploy failed' }, { status: 500 })
    }

    let workerUrl: string | undefined
    let apiKey: string | undefined

    for (const line of stdout.split('\n')) {
      if (line.includes('Worker URL:')) workerUrl = line.split('Worker URL:')[1].trim()
      if (line.includes('API Key:')) apiKey = line.split('API Key:')[1].trim()
    }

    return Response.json({ ok: true, workerUrl, apiKey })
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ ok: false, error }, { status: 500 })
  }
}
