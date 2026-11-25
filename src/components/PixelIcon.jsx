// Small pixel icons drawn in the same style as 宝宝:
// a paw (nudge a friend) and a fish treat (cheer a finished task).
const ICONS = {
  paw: [
    '...KK..KK...',
    '..KPPK.KPPK.',
    '..KPPKKKPPK.',
    'KK.KK..KK.KK',
    'KPPK....KPPK',
    'KPPK.KK.KPPK',
    '.KK.KPPK.KK.',
    '...KPPPPK...',
    '..KPPPPPPK..',
    '..KPPPPPPK..',
    '...KPPPPK...',
    '....KKKK....',
  ],
  fish: [
    '............',
    '....KKKK..K.',
    '..KKLLLLKKLK',
    '.KLLLLLLLKLK',
    'KLWKLLMLLLKK',
    'KLKKLMLMLLK.',
    '.KLLLLMLLLKK',
    '..KKLLLLKKLK',
    '....KKKK.KLK',
    '..........K.',
    '............',
    '............',
  ],
}
const COLORS = { K: '#2a292e', P: '#ee9aa0', L: '#86b6d9', M: '#5d8fb8', W: '#ffffff' }

export default function PixelIcon({ name, size = 24 }) {
  const rows = ICONS[name]
  return (
    <svg className="pixel-icon" viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((c, x) =>
        c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />))}
    </svg>
  )
}
