import { useEffect, useRef, useState } from 'react'
import type { LetterCase } from '../content/letters'
import { Icon } from './Icon'

export function FamilyDialog({ letterCase, onCaseChange, onClose }: {
  letterCase: LetterCase
  onCaseChange: (letterCase: LetterCase) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [unlocked, setUnlocked] = useState(false)
  const [holding, setHolding] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => {
      clearTimeout(timer.current)
      element.close()
    }
  }, [])

  useEffect(() => {
    if (unlocked) title.current?.focus()
  }, [unlocked])

  function close() {
    // Remove the modal's inert state before returning focus to its opener.
    dialog.current?.close()
    onClose()
  }

  function cancelHold() {
    clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
  }

  function startHold() {
    if (timer.current) return
    setHolding(true)
    timer.current = setTimeout(() => {
      setUnlocked(true)
      setHolding(false)
    }, 2000)
  }

  return (
    <dialog ref={dialog} className="family-dialog" aria-labelledby="family-title" onCancel={(event) => { event.preventDefault(); close() }}>
      <button className="icon-button dialog-close" aria-label="Cerrar espacio para familias" onClick={close}><Icon name="close" /></button>
      <div className="dialog-symbol"><Icon name={unlocked ? 'sprout' : 'lock'} size={29} /></div>
      <h2 id="family-title" ref={title} tabIndex={-1}>{unlocked ? 'Crecer a su ritmo.' : 'Un espacio para familias.'}</h2>
      {!unlocked ? <>
        <p>Las cosas de grandes se quedan aquí.<br />Mantén presionado el botón durante 2 segundos para entrar.</p>
        <button
          className={`hold-button ${holding ? 'is-holding' : ''}`}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startHold() }}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onLostPointerCapture={cancelHold}
          onBlur={cancelHold}
          onContextMenu={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              if (!event.repeat) startHold()
            }
          }}
          onKeyUp={cancelHold}
        >
          <span><Icon name="lock" size={18} /> {holding ? 'Un momentito…' : 'Mantén presionado para entrar'}</span>
        </button>
      </> : <>
        <p>Unos minutos juntos valen más que muchas letras. Acompaña, escucha y deja que tu peque explore.</p>
        <section className="family-section" aria-labelledby="letter-case-label">
          <h3 id="letter-case-label">Así vemos las letras</h3>
          <div className="case-options">
            <button aria-pressed={letterCase === 'lower'} onClick={() => onCaseChange('lower')}><span>abc</span>Minúsculas <small>Recomendado para empezar</small></button>
            <button aria-pressed={letterCase === 'upper'} onClick={() => onCaseChange('upper')}><span>ABC</span>Mayúsculas <small>Otra forma de reconocerlas</small></button>
          </div>
        </section>
        <section className="audio-note">
          <Icon name="sound" size={22} />
          <div><h3>Grabaciones de voz</h3><p>Las letras y las palabras tienen voz humana. Por ahora, m, p, s y l se escuchan como «eme», «pe», «ese» y «ele». Más adelante usaremos sus sonidos aislados. Estas grabaciones aún no tienen una revisión educativa.</p></div>
        </section>
        <div className="family-principles">
          <span><Icon name="check" size={16} /> Explorar sin prisa</span>
          <span><Icon name="check" size={16} /> Sin anuncios, cuentas ni puntuaciones</span>
          <span><Icon name="check" size={16} /> Las preferencias se guardan solo aquí</span>
        </div>
        <button className="primary-button family-done" onClick={close}>Volver a descubrir <Icon name="arrow-right" size={18} /></button>
      </>}
    </dialog>
  )
}
