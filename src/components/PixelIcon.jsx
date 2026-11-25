// Small pixel speech bubbles for checking in on friends:
// "…" = how's it going? (unfinished task), heart = nice work (finished task).
const ICONS = {
  checkin: [
    '............',
    '..KKKKKKKK..',
    '.KWWWWWWWWK.',
    'KWWWWWWWWWWK',
    'KWWWWWWWWWWK',
    'KWGGWGGWGGWK',
    'KWGGWGGWGGWK',
    'KWWWWWWWWWWK',
    '.KWWWWWWWWK.',
    '..KKWKKKKK..',
    '..KWK.......',
    '..KK........',
  ],
  cheer: [
    '............',
    '..KKKKKKKK..',
    '.KWWWWWWWWK.',
    'KWWRRWWRRWWK',
    'KWRRRRRRRRWK',
    'KWRRRRRRRRWK',
    'KWWRRRRRRWWK',
    'KWWWRRRRWWWK',
    '.KWWWRRWWWK.',
    '..KKWKKKKK..',
    '..KWK.......',
    '..KK........',
  ],
}
// Outline and dots follow the theme's sage (lighter in dark mode).
const COLORS = { K: 'var(--accent)', G: 'var(--accent)', W: '#fffdf7', R: '#e07a8a' }

export default function PixelIcon({ name, size = 24 }) {
  const rows = ICONS[name]
  return (
    <svg className="pixel-icon" viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((c, x) =>
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />))}
    </svg>
  )
}
