import { describe, expect, it } from 'vitest'
import { getCollection } from '../content/letters'
import { makeRound } from './listening'

describe('listening activity', () => {
  const vowels = getCollection('vowels')

  it('offers two distinct choices, including the target', () => {
    for (let index = 0; index < 100; index++) {
      const round = makeRound(vowels)
      expect(new Set(round.choices.map((choice) => choice.id)).size).toBe(2)
      expect(round.choices).toContain(round.target)
      expect(vowels).toContain(round.target)
    }
  })

  it('does not repeat the previous target', () => {
    for (const previous of vowels) {
      for (const random of [() => 0, () => 0.999]) {
        expect(makeRound(vowels, previous.id, random).target.id).not.toBe(previous.id)
      }
    }
  })

  it('places the target on either side', () => {
    const left = makeRound(vowels, undefined, () => 0)
    const right = makeRound(vowels, undefined, () => 0.999)
    expect(left.choices[0]).toBe(left.target)
    expect(right.choices[1]).toBe(right.target)
  })

  it('keeps consonant rounds within the selected collection', () => {
    const consonants = getCollection('consonants')
    const round = makeRound(consonants)
    expect(round.choices.every((choice) => consonants.includes(choice))).toBe(true)
  })

  it('rejects a collection with fewer than two letters', () => {
    expect(() => makeRound([])).toThrow()
    expect(() => makeRound([vowels[0]])).toThrow()
  })
})
