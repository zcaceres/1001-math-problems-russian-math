import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { BrowserAudio, type PlaybackStatus } from './audio/player'
import { displayLetter, getCollection, type CollectionId, type Letter, type LetterCase } from './content/letters'
import { assetUrl } from './platform/assets'
import { makeRound, type ListeningRound } from './domain/listening'
import { ActivityMenu, type ActivityMode } from './components/ActivityMenu'
import { FamilyDialog } from './components/FamilyDialog'
import { Icon } from './components/Icon'
import { TitleScreen } from './components/TitleScreen'

function readLetterCase(): LetterCase {
  try {
    return localStorage.getItem('semilla-letter-case') === 'upper' ? 'upper' : 'lower'
  } catch {
    return 'lower'
  }
}

function letterStyle(letter: Letter): CSSProperties {
  return { '--letter-color': letter.color, '--letter-wash': letter.wash } as CSSProperties
}

export function App() {
  const [showTitle, setShowTitle] = useState(true)
  const [mode, setMode] = useState<ActivityMode>('explore')
  const [collectionId, setCollectionId] = useState<CollectionId>('vowels')
  const [index, setIndex] = useState(0)
  const [letterCase, setLetterCase] = useState<LetterCase>(readLetterCase)
  const [muted, setMuted] = useState(false)
  const [familyOpen, setFamilyOpen] = useState(false)
  const [playback, setPlayback] = useState<PlaybackStatus>('idle')
  const [playingKey, setPlayingKey] = useState<string>()
  const [round, setRound] = useState<ListeningRound>(() => makeRound(getCollection('vowels')))
  const [answer, setAnswer] = useState<'waiting' | 'again' | 'found'>('waiting')
  const [hasListened, setHasListened] = useState(false)
  const audio = useMemo(() => new BrowserAudio(), [])
  const menuButton = useRef<HTMLButtonElement>(null)
  const exploreButton = useRef<HTMLButtonElement>(null)
  const focusAfterTitle = useRef(false)
  const collection = getCollection(collectionId)
  const letter = collection[index]
  const playing = playback === 'playing'

  const finishTitle = useCallback((restoreFocus: boolean) => {
    focusAfterTitle.current = restoreFocus
    setShowTitle(false)
  }, [])

  useEffect(() => {
    if (!showTitle && focusAfterTitle.current) {
      exploreButton.current?.focus({ preventScroll: true })
      focusAfterTitle.current = false
    }
  }, [showTitle])

  useEffect(() => {
    const unsubscribe = audio.subscribe(setPlayback)
    return () => { unsubscribe(); audio.dispose() }
  }, [audio])

  useEffect(() => {
    const stop = () => {
      if (document.visibilityState === 'hidden') audio.stop()
    }
    document.addEventListener('visibilitychange', stop)
    return () => document.removeEventListener('visibilitychange', stop)
  }, [audio])

  function play(name: string) {
    setPlayingKey(name)
    // A direct request to listen restores sound; there is no silent dead end.
    if (muted) {
      audio.setMuted(false)
      setMuted(false)
    }
    void audio.play(assetUrl('audio', name))
  }

  function selectLetter(nextIndex: number, hear = true) {
    audio.stop()
    setIndex(nextIndex)
    if (hear && !muted) play(collection[nextIndex].sound)
  }

  function changeCollection(next: CollectionId) {
    audio.stop()
    setCollectionId(next)
    setIndex(0)
    setRound(makeRound(getCollection(next)))
    setAnswer('waiting')
    setHasListened(false)
  }

  function changeMode(next: ActivityMode) {
    if (next === mode) return
    audio.stop()
    setMode(next)
    setAnswer('waiting')
    setHasListened(false)
    if (next === 'listen') setRound(makeRound(collection))
  }

  function nextRound() {
    audio.stop()
    setRound(makeRound(collection, round.target.id))
    setAnswer('waiting')
    setHasListened(false)
  }

  function choose(choice: Letter) {
    if (!hasListened || answer === 'found') return
    if (choice.id === round.target.id) {
      setAnswer('found')
      play(choice.wordAudio)
    } else {
      setAnswer('again')
      play(round.target.sound)
    }
  }

  function changeCase(next: LetterCase) {
    setLetterCase(next)
    try { localStorage.setItem('semilla-letter-case', next) } catch { /* Private browsing still works. */ }
  }

  return (
    <>
    <div className="app-shell" inert={showTitle} aria-hidden={showTitle || undefined}>
      <ActivityMenu
        triggerRef={menuButton}
        mode={mode}
        collectionId={collectionId}
        collection={collection}
        index={index}
        letterCase={letterCase}
        muted={muted}
        onOpen={() => audio.stop()}
        onModeChange={changeMode}
        onCollectionChange={changeCollection}
        onLetterChange={(nextIndex) => { changeMode('explore'); selectLetter(nextIndex) }}
        onMuteChange={() => { audio.setMuted(!muted); setMuted(!muted) }}
        onFamilies={() => { audio.stop(); setFamilyOpen(true) }}
      />

      <main className="activity-stage" style={letterStyle(mode === 'explore' ? letter : round.target)}>
        <h1 className="sr-only">{mode === 'explore' ? 'Explorar los sonidos' : 'Escuchar y encontrar'}</h1>
        <section className={`learning-space ${mode === 'listen' ? 'listening-space' : ''}`} aria-label={mode === 'explore' ? 'Explorar los sonidos' : 'Escuchar y encontrar'}>
          {mode === 'explore' ? (
            <div className="explore-content" key={`${collectionId}-${letter.id}-${letterCase}`}>
              <button ref={exploreButton} className="letter-panel" aria-label={`Escuchar la letra ${letter.id}`} onClick={() => play(letter.sound)}>
                <span className={`hero-letter ${playing && playingKey === letter.sound ? 'is-speaking' : ''}`}>{displayLetter(letter, letterCase)}</span>
                <span className={`sound-disc ${playing && playingKey === letter.sound ? 'is-playing' : ''}`}><Icon name="sound" size={24} /></span>
              </button>
              <button className="picture-panel" aria-label={`Escuchar la palabra ${letter.word}`} onClick={() => play(letter.wordAudio)}>
                <span className="illustration-frame">
                  <span className="illustration-ground" />
                  <img className={`hero-illustration ${playing && playingKey === letter.wordAudio ? 'is-speaking' : ''}`} src={assetUrl('images', letter.image)} alt={letter.word} draggable="false" />
                </span>
                <span className="picture-word"><span>{letterCase === 'upper' ? letter.word[0].toLocaleUpperCase('es') : letter.word[0]}</span>{letterCase === 'upper' ? letter.word.slice(1).toLocaleUpperCase('es') : letter.word.slice(1)}</span>
              </button>
            </div>
          ) : (
            <div className="listen-content">
              <button className={`listen-sound ${playing && playingKey === round.target.sound ? 'is-playing' : ''}`} aria-label="Escuchar la letra que buscamos" onClick={() => { setHasListened(true); play(round.target.sound) }}><Icon name="sound" size={44} /></button>
              <div className="listening-choices">
                {round.choices.map((choice) => (
                  <button
                    key={choice.id}
                    className={`choice-card ${answer === 'found' && choice.id === round.target.id ? 'is-found' : ''}`}
                    aria-label={`Elegir ${displayLetter(choice, letterCase)}`}
                    aria-disabled={!hasListened || answer === 'found'}
                    onClick={() => choose(choice)}
                    style={letterStyle(choice)}
                  >
                    <span>{displayLetter(choice, letterCase)}</span>
                    {answer === 'found' && choice.id === round.target.id && <span className="found-check"><Icon name="check" size={26} /></span>}
                  </button>
                ))}
              </div>
              <div className="sr-only" aria-live="polite">
                {answer === 'found' ? '¡La encontraste!' : answer === 'again' ? 'Escuchemos una vez más. Tú puedes.' : hasListened ? 'Toca la letra que escuchaste.' : 'Primero, toca para escuchar'}
              </div>
            </div>
          )}
        </section>

        <div className={playback === 'unavailable' ? 'audio-error' : 'sr-only'} role="status">
          {playback === 'unavailable' ? 'No pudimos reproducir el audio. Toca de nuevo para reintentar.' : ''}
        </div>

        <div className={`activity-navigation ${mode === 'listen' ? 'listening-navigation' : ''}`}>
          {mode === 'explore' ? <>
            <button className="arrow-button" aria-label="Letra anterior" onClick={() => selectLetter((index - 1 + collection.length) % collection.length)}><Icon name="arrow-left" size={28} /></button>
            <div className="letter-position" role="img" aria-label={`Letra ${index + 1} de ${collection.length}`}>
              {collection.map((item, itemIndex) => <span key={item.id} className={itemIndex === index ? 'current' : ''} />)}
            </div>
            <button className="arrow-button" aria-label="Letra siguiente" onClick={() => selectLetter((index + 1) % collection.length)}><Icon name="arrow-right" size={28} /></button>
          </> : answer === 'found' && <button className="arrow-button next-sound" aria-label="Otro sonido" onClick={nextRound}><Icon name="arrow-right" size={28} /></button>}
        </div>
      </main>

      {familyOpen && <FamilyDialog letterCase={letterCase} onCaseChange={changeCase} onClose={() => { setFamilyOpen(false); menuButton.current?.focus() }} />}
    </div>
    {showTitle && <TitleScreen onComplete={finishTitle} />}
    </>
  )
}
