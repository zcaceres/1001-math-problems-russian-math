import { useRef, useState, type RefObject } from 'react'
import { collections, displayLetter, type CollectionId, type Letter, type LetterCase } from '../content/letters'
import { Icon } from './Icon'

export type ActivityMode = 'explore' | 'listen'

export function ActivityMenu({ triggerRef, mode, collectionId, collection, index, letterCase, muted, onOpen, onModeChange, onCollectionChange, onLetterChange, onMuteChange, onFamilies }: {
  triggerRef: RefObject<HTMLButtonElement | null>
  mode: ActivityMode
  collectionId: CollectionId
  collection: readonly Letter[]
  index: number
  letterCase: LetterCase
  muted: boolean
  onOpen: () => void
  onModeChange: (mode: ActivityMode) => void
  onCollectionChange: (collection: CollectionId) => void
  onLetterChange: (index: number) => void
  onMuteChange: () => void
  onFamilies: () => void
}) {
  const popover = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  function close() {
    popover.current?.hidePopover()
    triggerRef.current?.focus()
  }

  function select(action: () => void) {
    close()
    action()
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="menu-trigger icon-button"
        popoverTarget="activity-menu"
        aria-label="Menú de actividades"
        aria-expanded={open}
        aria-controls="activity-menu"
        aria-haspopup="dialog"
      >
        <Icon name="more" size={24} />
      </button>
      <div
        ref={popover}
        id="activity-menu"
        className="activity-menu"
        popover="auto"
        role="dialog"
        aria-labelledby="menu-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            // Safari does not focus a pointer-activated trigger automatically.
            event.preventDefault()
            close()
          }
        }}
        onToggle={(event) => {
          const isOpen = event.newState === 'open'
          setOpen(isOpen)
          if (isOpen) {
            onOpen()
            // React autoFocus runs at mount, while this popover is still hidden.
            closeButton.current?.focus()
          }
        }}
      >
        <div className="menu-heading">
          <h2 id="menu-title"><Icon name="sprout" size={23} /><span>El abecedario de Penélope</span></h2>
          <button ref={closeButton} className="icon-button" aria-label="Cerrar menú" onClick={close}><Icon name="close" /></button>
        </div>
        <section className="menu-section" aria-labelledby="activity-label">
          <h3 id="activity-label">Actividad</h3>
          <button className="menu-option" aria-pressed={mode === 'explore'} onClick={() => select(() => onModeChange('explore'))}>
            <Icon name="sprout" /><span>Explorar</span>{mode === 'explore' && <Icon name="check" size={17} />}
          </button>
          <button className="menu-option" aria-pressed={mode === 'listen'} onClick={() => select(() => onModeChange('listen'))}>
            <Icon name="ear" /><span>Escuchar y encontrar</span>{mode === 'listen' && <Icon name="check" size={17} />}
          </button>
        </section>
        <section className="menu-section" aria-labelledby="letters-label">
          <h3 id="letters-label">Letras</h3>
          {(Object.keys(collections) as CollectionId[]).map((id) => (
            <button key={id} className="menu-option" aria-pressed={collectionId === id} onClick={() => select(() => onCollectionChange(id))}>
              <span>{collections[id].label}</span>{collectionId === id && <Icon name="check" size={17} />}
            </button>
          ))}
          <div className="menu-letters" aria-label="Ir a una letra">
            {collection.map((letter, letterIndex) => (
              <button
                key={letter.id}
                aria-label={`Explorar ${displayLetter(letter, letterCase)}, ${letter.word}`}
                aria-pressed={mode === 'explore' && letterIndex === index}
                onClick={() => select(() => onLetterChange(letterIndex))}
              >{displayLetter(letter, letterCase)}</button>
            ))}
          </div>
        </section>
        <div className="menu-section">
          <button className="menu-option" aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'} aria-pressed={muted} onClick={() => select(onMuteChange)}>
            <Icon name={muted ? 'muted' : 'sound'} /><span>{muted ? 'Activar sonido' : 'Silenciar sonido'}</span>
          </button>
          <button className="menu-option" onClick={() => select(onFamilies)}>
            <Icon name="lock" /><span>Para familias</span>
          </button>
        </div>
      </div>
    </>
  )
}
