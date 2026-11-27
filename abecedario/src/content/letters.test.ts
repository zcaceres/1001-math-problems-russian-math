import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collections, displayLetter, getCollection, letters, type CollectionId } from './letters'
import recording from '../../scripts/audio-sources/recording.json'
import recordingChecksums from '../../scripts/audio-sources/recording-checksums.json'

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

  it('ships all images, letter readings and word recordings as local files', () => {
    for (const letter of letters) {
      expect(existsSync(resolve(`public/images/${letter.image}.svg`))).toBe(true)
      for (const audio of [letter.sound, letter.wordAudio]) {
        const file = resolve(`public/audio/${audio}.mp3`)
        expect(existsSync(file), file).toBe(true)
        expect(readFileSync(file).byteLength).toBeGreaterThan(500)
      }
    }
  })

  it('changes the visual case without changing the letter recording', () => {
    const letter = letters[0]
    expect(displayLetter(letter, 'lower')).toBe('a')
    expect(displayLetter(letter, 'upper')).toBe('A')
    expect(letter.sound).toBe('a')
  })

  it('pins every audio file to the human recording and its cut recipe', () => {
    const ids = letters.flatMap((letter) => [letter.sound, letter.wordAudio]).sort()
    expect(recording.source.kind).toBe('human-recording')
    expect(recording.source.sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(recording.clips.map((clip) => clip.id).sort()).toEqual(ids)
    expect(Object.keys(recordingChecksums.clips).sort()).toEqual(ids)
    expect(recordingChecksums.sourceSha256).toBe(recording.source.sha256)
    const cuts = new Map(recording.clips.map((clip) => [clip.id, clip]))
    for (const letter of letters) {
      expect(cuts.get(letter.sound)?.kind).toBe('letter')
      expect(cuts.get(letter.wordAudio)).toMatchObject({ kind: 'word', text: letter.word })
    }
    const recipe = readFileSync(resolve('scripts/audio-sources/recording.json'))
    expect(recordingChecksums.recipeSha256).toBe(createHash('sha256').update(recipe).digest('hex'))
    const fingerprints = new Map(Object.entries(recordingChecksums.clips))
    let previousEnd = 0
    for (const clip of recording.clips) {
      const encoded = fingerprints.get(clip.id)!
      const file = readFileSync(resolve(`public/audio/${clip.id}.mp3`))
      expect(createHash('sha256').update(file).digest('hex')).toBe(encoded.sha256)
      expect(clip.start).toBeGreaterThanOrEqual(0)
      expect(clip.start).toBeGreaterThanOrEqual(previousEnd)
      expect(clip.end).toBeGreaterThan(clip.start)
      expect(clip.end).toBeLessThanOrEqual(recording.source.decodedDurationSeconds)
      expect(encoded.durationSeconds).toBeCloseTo(clip.end - clip.start, 2)
      expect(encoded.peakDbfs).toBeGreaterThanOrEqual(-10)
      expect(encoded.peakDbfs).toBeLessThanOrEqual(-3)
      previousEnd = clip.end
    }
  })

  it('preserves the approved consonant names rather than cropping out phonemes', () => {
    expect(recording.letterPlayback).toBe('names-as-recorded')
    const names = Object.fromEntries(recording.clips.filter((clip) => clip.kind === 'letter').map((clip) => [clip.id, clip.text]))
    expect(names).toMatchObject({ m: 'eme', p: 'pe', s: 'ese', l: 'ele' })
    for (const id of collections.consonants.ids) {
      const clip = recording.clips.find((candidate) => candidate.id === id)!
      expect(clip.end - clip.start).toBeGreaterThan(0.5)
    }
  })
})
