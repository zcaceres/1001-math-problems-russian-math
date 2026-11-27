import type { CSSProperties } from 'react'

export type IconName = 'sprout' | 'sound' | 'muted' | 'ear' | 'arrow-left' | 'arrow-right' | 'lock' | 'close' | 'check' | 'heart' | 'leaf' | 'hand' | 'more'

const paths: Record<IconName, React.ReactNode> = {
  sprout: <><path d="M12 21v-9M12 15C3 16 3 6 3 6s10-1 9 9ZM12 11C11 2 21 3 21 3s0 9-9 8Z" /></>,
  sound: <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  muted: <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="m16 9 6 6m0-6-6 6" /></>,
  ear: <><path d="M6 9a7 7 0 0 1 14 0c0 6-6 6-6 10a3 3 0 0 1-6 0M10 9a3 3 0 0 1 6 0c0 3-3 3-3 5M3 6a12 12 0 0 0 0 8" /></>,
  'arrow-left': <><path d="m14 5-7 7 7 7M7 12h13" /></>,
  'arrow-right': <><path d="m10 5 7 7-7 7M17 12H4" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12 4 4L19 6" />,
  heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />,
  leaf: <><path d="M20 3C6 2 2 8 5 15c7 5 16 0 15-12ZM3 21 15 9" /></>,
  hand: <><path d="M8 13V5a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v5c0 4-3 6-6 6h-1c-3 0-4-2-6-4l-3-4a2 2 0 0 1 3-2l1 1Z" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
}

export function Icon({ name, size = 20, className, style }: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>
}
