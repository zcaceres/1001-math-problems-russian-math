export type PlaybackStatus = 'idle' | 'playing' | 'unavailable'
export type PlaybackListener = (status: PlaybackStatus) => void

/**
 * The UI only knows this port. An iPad implementation can replace BrowserAudio
 * with an AVAudioPlayer adapter without changing content or activity rules.
 */
export interface AudioPlayer {
  play(source: string): Promise<void>
  stop(): void
  setMuted(muted: boolean): void
  subscribe(listener: PlaybackListener): () => void
  dispose(): void
}

export class BrowserAudio implements AudioPlayer {
  private current: HTMLAudioElement | undefined
  private muted = false
  private listeners = new Set<PlaybackListener>()
  private status: PlaybackStatus = 'idle'
  private generation = 0

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener)
    listener(this.status)
    return () => { this.listeners.delete(listener) }
  }

  private emit(status: PlaybackStatus) {
    this.status = status
    this.listeners.forEach((listener) => listener(status))
  }

  async play(source: string) {
    this.stop()
    if (this.muted) return
    const generation = this.generation
    const audio = new Audio(source)
    this.current = audio
    audio.onended = () => {
      if (generation === this.generation) this.stop()
    }
    audio.onerror = () => {
      if (generation === this.generation) this.emit('unavailable')
    }
    try {
      // Called directly from a gesture, including on iOS. Never autoplay.
      await audio.play()
      if (generation === this.generation) this.emit('playing')
    } catch {
      if (generation === this.generation) this.emit('unavailable')
    }
  }

  stop() {
    this.generation += 1
    if (this.current) {
      this.current.pause()
      this.current.onended = null
      this.current.onerror = null
      this.current = undefined
    }
    this.emit('idle')
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (muted) this.stop()
  }

  dispose() {
    this.stop()
    this.listeners.clear()
  }
}
