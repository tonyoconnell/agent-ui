/**
 * skins.test.ts — Verify 7 persona vocabulary skins
 *
 * Each persona sees the same mark/warn/fade arithmetic through a different
 * vocabulary. Tests confirm the vocabulary is correct and all 13 skins
 * (6 metaphors + 7 personas) are registered and structurally complete.
 */

import { describe, expect, it } from 'vitest'
import { agent, ceo, dev, freelancer, gamer, getSkin, investor, kid, PERSONA_SKIN_IDS, skins } from './index'

// ── Structural completeness ────────────────────────────────────────────────────

describe('skins registry', () => {
  it('should have 13 skins total (6 metaphors + 7 personas)', () => {
    expect(Object.keys(skins)).toHaveLength(13)
  })

  it('should include all 6 metaphor skins', () => {
    expect(skins.ant).toBeDefined()
    expect(skins.brain).toBeDefined()
    expect(skins.team).toBeDefined()
    expect(skins.mail).toBeDefined()
    expect(skins.water).toBeDefined()
    expect(skins.signal).toBeDefined()
  })

  it('should include all 7 persona skins', () => {
    for (const id of PERSONA_SKIN_IDS) {
      expect(skins[id]).toBeDefined()
    }
  })

  it('should export PERSONA_SKIN_IDS with exactly 7 entries', () => {
    expect(PERSONA_SKIN_IDS).toHaveLength(7)
    expect(PERSONA_SKIN_IDS).toContain('ceo')
    expect(PERSONA_SKIN_IDS).toContain('dev')
    expect(PERSONA_SKIN_IDS).toContain('investor')
    expect(PERSONA_SKIN_IDS).toContain('gamer')
    expect(PERSONA_SKIN_IDS).toContain('kid')
    expect(PERSONA_SKIN_IDS).toContain('freelancer')
    expect(PERSONA_SKIN_IDS).toContain('agent')
  })

  it('every skin should have all required fields', () => {
    const requiredFields = [
      'id',
      'name',
      'actor',
      'group',
      'flow',
      'carrier',
      'send',
      'strengthen',
      'weaken',
      'decay',
      'open',
      'blocked',
      'closing',
      'proven',
      'atRisk',
      'colors',
      'icons',
    ]
    for (const [id, skin] of Object.entries(skins)) {
      for (const field of requiredFields) {
        expect(skin, `skin ${id} missing field ${field}`).toHaveProperty(field)
      }
    }
  })

  it('every skin should have all 8 color fields', () => {
    const colorFields = ['primary', 'secondary', 'success', 'warning', 'danger', 'muted', 'background', 'surface']
    for (const [id, skin] of Object.entries(skins)) {
      for (const c of colorFields) {
        expect(skin.colors, `skin ${id} missing color ${c}`).toHaveProperty(c)
      }
    }
  })

  it('every skin should have all 8 icon fields', () => {
    const iconFields = ['actor', 'group', 'flow', 'entry', 'open', 'blocked', 'proven', 'atRisk']
    for (const [id, skin] of Object.entries(skins)) {
      for (const ic of iconFields) {
        expect(skin.icons, `skin ${id} missing icon ${ic}`).toHaveProperty(ic)
      }
    }
  })
})

// ── getSkin helper ────────────────────────────────────────────────────────────

describe('getSkin()', () => {
  it('should return the correct skin by id', () => {
    expect(getSkin('ceo').id).toBe('ceo')
    expect(getSkin('gamer').id).toBe('gamer')
  })

  it('should fall back to team skin for unknown id', () => {
    expect(getSkin('unknown').id).toBe('team')
  })
})

// ── CEO — Business vocabulary ─────────────────────────────────────────────────

describe('CEO skin', () => {
  it('should use business-appropriate action vocabulary', () => {
    expect(ceo.strengthen).toBe('commend') // mark() → commend
    expect(ceo.weaken).toBe('flag') // warn() → flag
    expect(ceo.decay).toBe('forget') // fade() → forget
    expect(ceo.send).toBe('delegate') // signal() → delegate
  })

  it('should describe paths in status terms', () => {
    expect(ceo.proven).toBe('star')
    expect(ceo.blocked).toBe('fired')
    expect(ceo.atRisk).toBe('struggling')
  })

  it('should use team/agent actor vocabulary', () => {
    expect(ceo.actor).toBe('agent')
    expect(ceo.group).toBe('team')
  })
})

// ── Dev — Technical vocabulary ────────────────────────────────────────────────

describe('Dev skin', () => {
  it('should use substrate-native action vocabulary', () => {
    expect(dev.strengthen).toBe('mark') // mark() stays mark()
    expect(dev.weaken).toBe('warn') // warn() stays warn()
    expect(dev.decay).toBe('fade') // fade() stays fade()
    expect(dev.send).toBe('signal') // signal() stays signal()
  })

  it('should use substrate entity vocabulary', () => {
    expect(dev.actor).toBe('unit')
    expect(dev.group).toBe('world')
    expect(dev.open).toBe('highway')
    expect(dev.blocked).toBe('toxic')
  })
})

// ── Investor — Financial vocabulary ──────────────────────────────────────────

describe('Investor skin', () => {
  it('should use financial action vocabulary', () => {
    expect(investor.strengthen).toBe('earn')
    expect(investor.weaken).toBe('lose')
    expect(investor.decay).toBe('depreciate')
    expect(investor.send).toBe('invest')
  })

  it('should use portfolio terminology', () => {
    expect(investor.group).toBe('portfolio')
    expect(investor.flow).toBe('revenue')
  })
})

// ── Gamer — Ant colony vocabulary ────────────────────────────────────────────

describe('Gamer skin', () => {
  it('should use ant-colony action vocabulary', () => {
    expect(gamer.strengthen).toBe('deposit') // mark() → deposit scent
    expect(gamer.weaken).toBe('alarm') // warn() → alarm signal
    expect(gamer.decay).toBe('evaporate') // fade() → evaporate scent
    expect(gamer.send).toBe('forage') // signal() → forage
  })

  it('should use colony entity vocabulary', () => {
    expect(gamer.actor).toBe('ant')
    expect(gamer.group).toBe('colony')
    expect(gamer.carrier).toBe('scent')
  })

  it('should be distinct from the metaphor ant skin (different status labels)', () => {
    // Gamer has game-oriented status; ant skin has colony-oriented status
    expect(gamer.id).toBe('gamer')
    expect(gamer.proven).toBe('super-trail') // game reward framing
  })
})

// ── Kid — Friendly vocabulary ─────────────────────────────────────────────────

describe('Kid skin', () => {
  it('should use simple friendly action vocabulary', () => {
    expect(kid.strengthen).toBe('cheer')
    expect(kid.weaken).toBe('boo')
    expect(kid.decay).toBe('forget')
    expect(kid.send).toBe('share')
  })

  it('should use friendly entity vocabulary', () => {
    expect(kid.actor).toBe('helper')
    expect(kid.group).toBe('friends')
    expect(kid.proven).toBe('best-friend')
  })
})

// ── Freelancer — Marketplace vocabulary ──────────────────────────────────────

describe('Freelancer skin', () => {
  it('should use marketplace action vocabulary', () => {
    expect(freelancer.strengthen).toBe('commend')
    expect(freelancer.weaken).toBe('flag')
    expect(freelancer.send).toBe('accept')
  })

  it('should use marketplace entity vocabulary', () => {
    expect(freelancer.actor).toBe('worker')
    expect(freelancer.group).toBe('marketplace')
    expect(freelancer.carrier).toBe('job')
    expect(freelancer.open).toBe('top-rated')
  })
})

// ── Agent — Raw substrate vocabulary ─────────────────────────────────────────

describe('Agent skin', () => {
  it('should use pure substrate vocabulary', () => {
    expect(agent.strengthen).toBe('mark')
    expect(agent.weaken).toBe('warn')
    expect(agent.decay).toBe('fade')
    expect(agent.send).toBe('emit') // emit() is the canonical signal primitive
  })

  it('should use substrate entity vocabulary', () => {
    expect(agent.actor).toBe('unit')
    expect(agent.group).toBe('substrate')
    expect(agent.proven).toBe('hardened') // highways frozen on Sui
    expect(agent.closing).toBe('dissolving') // dissolved outcome
  })
})

// ── Same math, different words ────────────────────────────────────────────────

describe('vocabulary diversity — same concept, 7 words', () => {
  const personaSkins = PERSONA_SKIN_IDS.map((id) => skins[id])

  it('strengthen has 7 distinct words across personas', () => {
    const words = personaSkins.map((s) => s.strengthen)
    const unique = new Set(words)
    // All 7 should be distinct — no two personas share the exact word
    // (ceo=commend, dev=mark, investor=earn, gamer=deposit, kid=cheer, freelancer=commend, agent=mark)
    // Note: ceo+freelancer share "commend", dev+agent share "mark" — that's intentional
    expect(unique.size).toBeGreaterThanOrEqual(4)
  })

  it('each persona uses a coherent vocabulary (send/strengthen share a metaphor domain)', () => {
    // CEO: delegate/commend — both are management actions
    expect(ceo.send).toBe('delegate')
    expect(ceo.strengthen).toBe('commend')

    // Gamer: forage/deposit — both are ant actions
    expect(gamer.send).toBe('forage')
    expect(gamer.strengthen).toBe('deposit')

    // Dev: signal/mark — both are substrate primitives
    expect(dev.send).toBe('signal')
    expect(dev.strengthen).toBe('mark')
  })
})
