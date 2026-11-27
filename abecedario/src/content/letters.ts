/**
 * Platform-independent learning content.
 * All audio comes from the user's human recording. Letter clips preserve the
 * spoken names (including eme, pe, ese, ele), not isolated consonant phonemes.
 * Exploration and the listening game intentionally use the same recordings.
 */
export interface Letter {
  id: string
  word: string
  image: string
  sound: string
  wordAudio: string
  color: string
  wash: string
}

export const letters: readonly Letter[] = [
  { id: 'a', word: 'abeja', image: 'abeja', sound: 'a', wordAudio: 'abeja', color: '#b76b53', wash: '#f4e9df' },
  { id: 'e', word: 'elefante', image: 'elefante', sound: 'e', wordAudio: 'elefante', color: '#8a9161', wash: '#eceddf' },
  { id: 'i', word: 'iglú', image: 'iglu', sound: 'i', wordAudio: 'iglu', color: '#b38b4a', wash: '#f6efdc' },
  { id: 'o', word: 'oso', image: 'oso', sound: 'o', wordAudio: 'oso', color: '#7d95a2', wash: '#e8eef0' },
  { id: 'u', word: 'uvas', image: 'uvas', sound: 'u', wordAudio: 'uvas', color: '#a1849c', wash: '#f0e8ee' },
  { id: 'm', word: 'manzana', image: 'manzana', sound: 'm', wordAudio: 'manzana', color: '#b76b53', wash: '#f4e9df' },
  { id: 'p', word: 'pato', image: 'pato', sound: 'p', wordAudio: 'pato', color: '#b38b4a', wash: '#f6efdc' },
  { id: 's', word: 'sol', image: 'sol', sound: 's', wordAudio: 'sol', color: '#8a9161', wash: '#eceddf' },
  { id: 'l', word: 'luna', image: 'luna', sound: 'l', wordAudio: 'luna', color: '#7d95a2', wash: '#e8eef0' },
]

export type CollectionId = 'vowels' | 'consonants'
export type LetterCase = 'lower' | 'upper'

export const collections: Record<CollectionId, { label: string; ids: readonly string[] }> = {
  vowels: { label: 'Las vocales', ids: ['a', 'e', 'i', 'o', 'u'] },
  consonants: { label: 'Primeras consonantes', ids: ['m', 'p', 's', 'l'] },
}

export function getCollection(id: CollectionId): Letter[] {
  return collections[id].ids.map((letterId) => letters.find((letter) => letter.id === letterId)!)
}

export function displayLetter(letter: Letter, letterCase: LetterCase): string {
  return letterCase === 'upper' ? letter.id.toLocaleUpperCase('es') : letter.id
}
