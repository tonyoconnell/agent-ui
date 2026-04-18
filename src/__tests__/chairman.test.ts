import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
}))

vi.mock('@/engine/agent-md', () => ({
  parse: vi.fn().mockReturnValue({ name: 'cto', group: 'roles', skills: [], prompt: '' }),
  syncAgentWithIdentity: vi.fn().mockResolvedValue({ name: 'cto', group: 'roles', skills: [], prompt: '' }),
}))

// Top-level imports — vi.mock is hoisted, so these get the mocked versions
import { readFile } from 'node:fs/promises'
import { createWorld as world } from '@/engine'
import { parse, syncAgentWithIdentity } from '@/engine/agent-md'
import { registerChairman, registerHire } from '@/engine/chairman'

describe('chairman engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-establish default implementations after clearAllMocks resets them
    vi.mocked(parse).mockReturnValue({ name: 'cto', group: 'roles', skills: [], prompt: '' })
    vi.mocked(syncAgentWithIdentity).mockResolvedValue({ name: 'cto', group: 'roles', skills: [], prompt: '' })
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'))
  })

  describe('registerHire', () => {
    it('wires hire handler on a unit', () => {
      const net = world()
      registerHire(net, 'agent')
      const u = net.get('agent')
      expect(u?.has('hire')).toBe(true)
    })

    it('hire with no template does not call syncAgentWithIdentity', async () => {
      const net = world()
      registerHire(net, 'agent')
      await net.ask({ receiver: 'agent:hire', data: { role: 'nonexistent-xyz' } })
      expect(syncAgentWithIdentity).not.toHaveBeenCalled()
    })

    it('hire with template calls syncAgentWithIdentity and returns uid', async () => {
      vi.mocked(readFile as (p: string, e: string) => Promise<string>).mockResolvedValueOnce('# cto markdown')
      const net = world()
      registerHire(net, 'agent')
      const outcome = await net.ask({ receiver: 'agent:hire', data: { role: 'cto' } })
      expect(syncAgentWithIdentity).toHaveBeenCalledOnce()
      expect(outcome.result).toBe('roles:cto')
    })
  })

  describe('registerChairman', () => {
    it('wires hire and build-team on ceo', () => {
      const net = world()
      registerChairman(net)
      const ceo = net.get('ceo')
      expect(ceo?.has('hire')).toBe(true)
      expect(ceo?.has('build-team')).toBe(true)
    })

    it('build-team returns building list', async () => {
      const net = world()
      registerChairman(net)
      const outcome = await net.ask({ receiver: 'ceo:build-team', data: {} })
      expect(outcome.result).toEqual({ building: ['cto', 'cmo', 'cfo'] })
    })
  })
})
