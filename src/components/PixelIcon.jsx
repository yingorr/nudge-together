// Small pixel icons. Speech bubbles share one style: "!" = reminders,
// "?" = nudge a friend, heart = cheer a friend's finished task.
const ICONS = {
  // speech bubble with a small pink heart: cheer a friend's finished task
  cheer: [
    '...TTTTTT...', '.TTWWWWWWTT.', 'TWWWWWWWWWWT', 'TWWRRWWRRWWT', 'TWWRRRRRRWWT', 'TWWWRRRRWWWT',
    'TWWWWRRWWWWT', 'TWWWWWWWWWWT', '.TTWWWWWWTT.', '..TWTTTTTT..', '..TT........', '..T.........',
  ],
  // speech bubble with a red "?": nudge a friend about an unfinished task
  ask: [
    '...TTTTTT...', '.TTWWWWWWTT.', 'TWWWXXXXWWWT', 'TWWXXWWXXWWT', 'TWWWWWXXWWWT', 'TWWWWXXWWWWT',
    'TWWWWWWWWWWT', 'TWWWWXXWWWWT', '.TTWWWWWWTT.', '..TWTTTTTT..', '..TT........', '..T.........',
  ],
  // single paw print: show / hide 宝宝 (drawn in the button's text color)
  check: ['......T', '.....TT', 'T...TT.', 'TT.TT..', '.TTT...', '..T....'],
  paw: ['..TT.TT..', '..TT.TT..', 'TT.....TT', 'TT.TTT.TT', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.', '.TTT.TTT.'],
  // speech bubble with a red "!": reminder banner
  bang: [
    '...TTTTTT...', '.TTWWWWWWTT.', 'TWWWWXXWWWWT', 'TWWWWXXWWWWT', 'TWWWWXXWWWWT', 'TWWWWXXWWWWT',
    'TWWWWWWWWWWT', 'TWWWWXXWWWWT', '.TTWWWWWWTT.', '..TWTTTTTT..', '..TT........', '..T.........',
  ],
}
// Outline and dots follow the theme's sage (lighter in dark mode); T = current text color.
const COLORS = { K: 'var(--accent)', G: 'var(--accent)', W: '#efe4cc', R: '#e07a8a', T: 'currentColor', X: '#d64545' }

export default function PixelIcon({ name, size = 24 }) {
  const rows = ICONS[name]
  return (
    <svg className="pixel-icon" viewBox={`0 0 ${rows[0].length} ${rows.length}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((c, x) =>
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />))}
    </svg>
  )
}
