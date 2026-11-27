import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { Icon } from './Icon'

const INTRO_DURATION_MS = 2400
const EXIT_DURATION_MS = 280
const REDUCED_MOTION_DURATION_MS = 600

export function TitleScreen({ onComplete }: { onComplete: (restoreFocus: boolean) => void }) {
  const screen = useRef<HTMLElement>(null)
  const completed = useRef(false)

  const complete = useCallback(() => {
    if (completed.current) return
    completed.current = true
    onComplete(screen.current?.contains(document.activeElement) ?? false)
  }, [onComplete])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timeout: ReturnType<typeof setTimeout>
    const scheduleCompletion = () => {
      clearTimeout(timeout)
      timeout = setTimeout(complete, motion.matches ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS)
    }
    scheduleCompletion()
    motion.addEventListener('change', scheduleCompletion)
    return () => {
      clearTimeout(timeout)
      motion.removeEventListener('change', scheduleCompletion)
    }
  }, [complete])

  // Completion is timer-driven, not animationend-driven: disabling animations
  // or a slow/missing font must never leave a child stuck on the opening screen.
  return (
    <main
      ref={screen}
      className="title-screen"
      aria-labelledby="opening-title"
      style={{
        '--title-exit-delay': `${INTRO_DURATION_MS - EXIT_DURATION_MS}ms`,
        '--title-exit-duration': `${EXIT_DURATION_MS}ms`,
      } as CSSProperties}
    >
      <div className="title-composition">
        <span className="title-sprout" aria-hidden="true"><Icon name="sprout" size={52} /></span>
        <h1 id="opening-title" aria-label="El abecedario de Penélope">
          <span className="title-prefix" aria-hidden="true">El abecedario de</span>
          <span className="title-name" aria-hidden="true">
            {Array.from('Penélope').map((letter, index) => (
              <span
                className="title-letter"
                key={index}
                style={{ '--letter-delay': `${300 + index * 65}ms` } as CSSProperties}
              >{letter}</span>
            ))}
          </span>
        </h1>
      </div>
      <button className="title-skip" aria-label="Entrar al abecedario" onClick={complete}>
        <span>Entrar al abecedario <Icon name="arrow-right" size={18} /></span>
      </button>
    </main>
  )
}
