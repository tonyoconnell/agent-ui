# Flow — Animation & Sequence Design

The ONE interface breathes. Signals pulse. Trails form. Highways glow.

## The Heartbeat

```
Signal sent → Edge pulses → Node receives → Trail strengthens → Highway forms
     ↓              ↓              ↓               ↓                ↓
   0ms           50ms          150ms           200ms            500ms+
```

Every interaction is visible. Every success remembered. Every failure fades.

## Signal Flow Sequence

### 1. Signal Departure (0ms)
```css
/* Source node contracts slightly, then releases */
@keyframes signal-send {
  0%   { transform: scale(1); }
  15%  { transform: scale(0.92); }      /* gather energy */
  30%  { transform: scale(1.08); }      /* release */
  100% { transform: scale(1); }
}
```
- Source node "breathes out"
- Particle spawns at source handle
- Subtle sound: soft click

### 2. Edge Travel (50-150ms)
```css
/* Particle travels along edge path */
@keyframes particle-travel {
  0%   { offset-distance: 0%; opacity: 1; }
  80%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0.8; }
}
```
- Glowing dot follows edge curve
- Edge briefly brightens as particle passes
- Trail effect: fading copies behind particle
- Speed proportional to edge strength (highways = fast)

### 3. Node Receive (150ms)
```css
/* Target node pulses on receive */
@keyframes signal-receive {
  0%   { transform: scale(1); box-shadow: 0 0 0 rgba(var(--color), 0); }
  50%  { transform: scale(1.1); box-shadow: 0 0 20px rgba(var(--color), 0.5); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(var(--color), 0); }
}
```
- Target node expands briefly
- Ring pulse radiates outward
- Subtle sound: soft chime

### 4. Trail Update (200ms)
```css
/* Edge thickness animates */
@keyframes trail-strengthen {
  0%   { stroke-width: var(--old-width); }
  50%  { stroke-width: calc(var(--new-width) * 1.2); }  /* overshoot */
  100% { stroke-width: var(--new-width); }
}
```
- Edge gets thicker (strength increase)
- Color shifts toward highway color
- Number badge updates with bounce

### 5. Highway Formation (500ms+)
```css
/* When edge crosses threshold, celebrate */
@keyframes highway-form {
  0%   { filter: brightness(1); }
  25%  { filter: brightness(1.5); }
  50%  { filter: brightness(2); }
  75%  { filter: brightness(1.5); }
  100% { filter: brightness(1.2); }  /* stays brighter */
}
```
- Flash of light along entire edge
- Particles burst from both endpoints
- Edge gains permanent glow
- Sound: ascending tone

## Failure Sequence

### Alarm Signal
```css
@keyframes alarm-pulse {
  0%, 100% { background: var(--danger); }
  50%      { background: var(--danger-bright); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}
```
- Edge flashes red
- Both nodes shake
- Alarm pheromone increases (edge gets redder)
- Sound: low warning tone

## Decay Sequence

### Global Fade
```css
@keyframes decay-wave {
  0%   { opacity: 1; filter: brightness(1); }
  50%  { opacity: 0.9; filter: brightness(0.8); }
  100% { opacity: 1; filter: brightness(1); }
}
```
- Wave effect sweeps across graph (left to right)
- All edges dim momentarily
- Weak edges fade more visibly
- Dead edges dissolve (particles scatter)

### Edge Death
```css
@keyframes edge-dissolve {
  0%   { opacity: 1; stroke-dasharray: none; }
  50%  { opacity: 0.5; stroke-dasharray: 5 5; }
  100% { opacity: 0; stroke-dasharray: 1 10; }
}
```
- Edge becomes dashed
- Fades to transparent
- Small particles drift away
- Removed from DOM after animation

## Inject Burst

When user triggers "inject" or burst:

```css
@keyframes burst-ripple {
  0%   { transform: scale(0); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}
```
- Central ripple expands from entry point
- All initial signals fire simultaneously
- Particles race outward along all edges
- Graph "lights up" progressively
- Sound: whoosh

## Skin-Specific Particle Styles

| Skin | Particle Shape | Trail Effect | Highway Glow |
|------|---------------|--------------|--------------|
| ant | amber dot | pheromone trail (gradient fade) | golden path |
| brain | blue spark | electric arc (jagged) | cyan pulse |
| team | arrow | motion blur | green highlight |
| mail | envelope icon | stamp trail | priority stripe |
| water | droplet | ripple rings | deep blue current |
| signal | wave pulse | frequency wave | white beam |

## State Transitions

### Node Status Change
```
active → proven:  green pulse + crown icon appears
active → at-risk: red flash + warning icon
proven → at-risk: crown fades, warning appears
```

### Edge Status Change
```
fresh → highway:   celebration burst
highway → fading:  glow dims gradually
fading → dead:     dissolve animation
fresh → toxic:     red flash, skull icon
```

### Task Status Change
```
todo → in_progress:  spinner appears
in_progress → complete:  checkmark burst
in_progress → failed:  x mark + shake
blocked → todo:  chains break animation
```

## Performance Guidelines

```typescript
// Batch animations with RAF
requestAnimationFrame(() => {
  particles.forEach(p => p.update())
  edges.forEach(e => e.updateGlow())
})

// Throttle during high activity
if (signalsPerSecond > 10) {
  skipParticleEffects = true
  useSimplePulse = true
}

// GPU-accelerated properties only
// YES: transform, opacity, filter
// NO:  width, height, top, left, stroke-width
```

## Timing Constants

```typescript
const TIMING = {
  // Signal flow
  SIGNAL_SEND: 100,      // ms - node breath
  PARTICLE_TRAVEL: 200,  // ms - base travel time
  SIGNAL_RECEIVE: 150,   // ms - node pulse
  
  // Trail updates
  TRAIL_STRENGTHEN: 300, // ms - edge thickness change
  HIGHWAY_FORM: 500,     // ms - celebration
  
  // Decay
  DECAY_WAVE: 1000,      // ms - sweep duration
  EDGE_DISSOLVE: 400,    // ms - death animation
  
  // Bursts
  INJECT_RIPPLE: 600,    // ms - burst wave
  
  // Intervals
  AMBIENT_PULSE: 3000,   // ms - highway ambient glow
  DECAY_INTERVAL: 5000,  // ms - auto-decay tick
}
```

## Sound Design (Optional)

| Event | Sound | Duration |
|-------|-------|----------|
| Signal send | Soft click | 50ms |
| Signal receive | Chime | 100ms |
| Highway form | Ascending tone | 300ms |
| Alarm | Low buzz | 200ms |
| Decay tick | Soft whoosh | 100ms |
| Edge death | Dissolve | 150ms |
| Inject burst | Whoosh | 400ms |

Sounds should be:
- Subtle (not distracting)
- Layered (multiple simultaneous OK)
- Disable-able (preference)
- Skin-themed if possible

## CSS Variables for Animation

```css
:root {
  /* Timing */
  --anim-fast: 100ms;
  --anim-normal: 200ms;
  --anim-slow: 500ms;
  
  /* Easing */
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Particle */
  --particle-size: 8px;
  --particle-glow: 12px;
  --trail-length: 3;
  
  /* Glow */
  --highway-glow: 0 0 15px var(--color-success);
  --alarm-glow: 0 0 10px var(--color-danger);
}
```

---

*Every signal visible. Every trail remembered. ONE flow.*
