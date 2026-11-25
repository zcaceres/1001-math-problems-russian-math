import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collections, displayLetter, getCollection, letters, type CollectionId } from './letters'
import consonantSources from '../../scripts/audio-sources/consonants.json'

describe('learning content', () => {
  it('starts with five vowels and introduces four simple consonants separately', () => {
    expect(getCollection('vowels').map((letter) => letter.id)).toEqual(['a', 'e', 'i', 'o', 'u'])
    expect(getCollection('consonants').map((letter) => letter.id)).toEqual(['m', 'p', 's', 'l'])
  })

  it('uses unique letters and matching initial sounds', () => {
    expect(new Set(letters.map((letter) => letter.id)).size).toBe(letters.length)
    for (const letter of letters) expect(letter.word.startsWith(letter.id)).toBe(true)
  })

  it('has no missing or duplicate collection entries', () => {
    for (const id of Object.keys(collections) as CollectionId[]) {
      const collection = getCollection(id)
      expect(collection.every(Boolean)).toBe(true)
      expect(new Set(collection.map((letter) => letter.id)).size).toBe(collection.length)
    }
  })

  it('ships all images, phonemes and word recordings as local files', () => {
    for (const letter of letters) {
      expect(existsSync(resolve(`public/images/${letter.image}.svg`))).toBe(true)
      for (const audio of [letter.sound, letter.wordAudio]) {
        const file = resolve(`public/audio/${audio}.mp3`)
        expect(existsSync(file), file).toBe(true)
        expect(readFileSync(file).byteLength).toBeGreaterThan(500)
      }
    }
  })

  it('changes the visual case without changing the phoneme', () => {
    const letter = letters[0]
    expect(displayLetter(letter, 'lower')).toBe('a')
    expect(displayLetter(letter, 'upper')).toBe('A')
    expect(letter.sound).toBe('a')
  })

  it('pins consonants to speech recordings instead of generated tones', () => {
    expect(Object.keys(consonantSources.clips).sort()).toEqual([...collections.consonants.ids].sort())
    for (const clip of Object.values(consonantSources.clips)) {
      const source = readFileSync(resolve('scripts/audio-sources', clip.source))
      expect(createHash('sha256').update(source).digest('hex')).toBe(clip.sha256)
      expect(clip.start).toBeGreaterThanOrEqual(0)
      expect(clip.end).toBeGreaterThan(clip.start)
      expect(clip.tempo).toBeGreaterThanOrEqual(0.5)
      expect(clip.tempo).toBeLessThanOrEqual(1)
    }
    // A stop consonant must not become a drawn-out musical note.
    const release = consonantSources.clips.p
    expect(release.end - release.start).toBeLessThan(0.05)
    expect(release.tempo).toBe(1)
  })
})
