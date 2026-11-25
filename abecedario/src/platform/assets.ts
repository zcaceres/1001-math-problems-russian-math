/** Web-bundle URL resolution stays outside the portable learning content. */
export function assetUrl(kind: 'images' | 'audio', name: string): string {
  return `${import.meta.env.BASE_URL}${kind}/${name}.${kind === 'images' ? 'svg' : 'mp3'}`
}
