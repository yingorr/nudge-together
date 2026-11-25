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
  // alarm clock: nudge a friend about an unfinished task
  alarm: [
    '.KK.....KK..', 'KKK.KKK.KKK.', 'KK.KWWWK.KK.', '..KWWKWWK...', '.KWWWKWWWK..', '.KWWWKWWWK..',
    '.KWWWKKKWK..', '.KWWWWWWWK..', '..KWWWWWK...', '...KKKKK....', '..K.....K...', '............',
  ],
  // single paw print: show / hide 宝宝 (drawn in the button's text color)
  paw: ['..TT.TT..', '..TT.TT..', 'TT.....TT', 'TT.TTT.TT', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.', '.TTT.TTT.'],
  // exclamation mark: reminder banner
  bang: [
    '...TTT...', '..TTTTT..', '..TTTTT..', '...TTT...', '...TTT...', '...TTT...',
    '...TTT...', '.........', '...TTT...', '...TTT...', '...TTT...',
  ],
}
// Outline and dots follow the theme's sage (lighter in dark mode); T = current text color.
const COLORS = { K: 'var(--accent)', G: 'var(--accent)', W: '#fffdf7', R: '#e07a8a', T: 'currentColor' }

export default function PixelIcon({ name, size = 24 }) {
  const rows = ICONS[name]
  return (
    <svg className="pixel-icon" viewBox={`0 0 ${rows[0].length} ${rows.length}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((c, x) =>
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />))}
    </svg>
  )
}
