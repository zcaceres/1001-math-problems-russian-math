import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserAudio, type PlaybackStatus } from './player'

class FakeAudio {
  static instances: FakeAudio[] = []
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  pause = vi.fn()
  constructor(public source: string) { FakeAudio.instances.push(this) }
}

describe('audio player', () => {
  let player: BrowserAudio
  let states: PlaybackStatus[]

  beforeEach(() => {
    FakeAudio.instances = []
    vi.stubGlobal('Audio', FakeAudio)
    states = []
    player = new BrowserAudio()
    player.subscribe((state) => states.push(state))
  })

  afterEach(() => { player.dispose(); vi.unstubAllGlobals() })

  it('plays the requested recording and returns to idle when it ends', async () => {
    await player.play('/audio/a.mp3')
    expect(FakeAudio.instances[0].source).toBe('/audio/a.mp3')
    expect(states.at(-1)).toBe('playing')
    FakeAudio.instances[0].onended?.()
    expect(states.at(-1)).toBe('idle')
  })

  it('stops the previous sound before playing another one', async () => {
    await player.play('/audio/a.mp3')
    const first = FakeAudio.instances[0]
    await player.play('/audio/e.mp3')
    expect(first.pause).toHaveBeenCalledOnce()
    expect(first.onended).toBeNull()
    expect(FakeAudio.instances[1].play).toHaveBeenCalledOnce()
  })

  it('stops and blocks playback while muted', async () => {
    await player.play('/audio/a.mp3')
    player.setMuted(true)
    await player.play('/audio/e.mp3')
    expect(FakeAudio.instances).toHaveLength(1)
    expect(states.at(-1)).toBe('idle')
    player.setMuted(false)
    await player.play('/audio/e.mp3')
    expect(FakeAudio.instances).toHaveLength(2)
  })

  it('reports loading errors and allows a retry', async () => {
    await player.play('/missing.mp3')
    FakeAudio.instances[0].onerror?.()
    expect(states.at(-1)).toBe('unavailable')
    await player.play('/audio/a.mp3')
    expect(states.at(-1)).toBe('playing')
  })

  it('handles rejected playback promises without an unhandled rejection', async () => {
    const rejected = Promise.reject(new Error('NotAllowedError'))
    const originalAudio = class extends FakeAudio {
      constructor(source: string) { super(source); this.play.mockReturnValue(rejected) }
    }
    vi.stubGlobal('Audio', originalAudio)
    await player.play('/audio/a.mp3')
    expect(states.at(-1)).toBe('unavailable')
  })

  it('ignores a late play resolution after stopping', async () => {
    let resolvePlay!: () => void
    vi.stubGlobal('Audio', class extends FakeAudio {
      constructor(source: string) {
        super(source)
        this.play.mockReturnValue(new Promise<void>((resolve) => { resolvePlay = resolve }))
      }
    })
    const pending = player.play('/audio/a.mp3')
    player.stop()
    resolvePlay()
    await pending
    expect(states.at(-1)).toBe('idle')
  })

  it('unsubscribes observers', () => {
    const observer = vi.fn()
    const unsubscribe = player.subscribe(observer)
    unsubscribe()
    player.stop()
    expect(observer).toHaveBeenCalledOnce()
  })
})
