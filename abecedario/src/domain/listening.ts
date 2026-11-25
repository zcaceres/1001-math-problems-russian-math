import type { Letter } from '../content/letters'

export interface ListeningRound {
  target: Letter
  choices: readonly [Letter, Letter]
}

/** No scores, time limits, or failure state. A child may listen and try again. */
export function makeRound(
  collection: readonly Letter[],
  previousId?: string,
  random: () => number = Math.random,
): ListeningRound {
  if (collection.length < 2) throw new Error('A listening activity needs at least two letters.')
  const candidates = collection.filter((letter) => letter.id !== previousId)
  const target = candidates[Math.floor(random() * candidates.length)]
  const alternatives = collection.filter((letter) => letter.id !== target.id)
  const alternative = alternatives[Math.floor(random() * alternatives.length)]
  return {
    target,
    choices: random() < 0.5 ? [target, alternative] : [alternative, target],
  }
}
