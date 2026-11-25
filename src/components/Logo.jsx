// Hand-drawn pixel wordmark: check bubble + "Nudge / Together" + two sparkles.
// Every glyph sits on a 9-row cell: rows 0-6 are cap height (baseline after row 6),
// lowercase x-height is rows 2-6, and rows 7-8 hold descenders (the g).
const GLYPHS = {
  N: ['K...K', 'KK..K', 'KK..K', 'K.K.K', 'K..KK', 'K..KK', 'K...K'],
  T: ['KKKKK', '..K..', '..K..', '..K..', '..K..', '..K..', '..K..'],
  u: ['....', '....', 'K..K', 'K..K', 'K..K', 'K..K', '.KKK'],
  d: ['...K', '...K', '.KKK', 'K..K', 'K..K', 'K..K', '.KKK'],
  g: ['....', '....', '.KKK', 'K..K', 'K..K', 'K..K', '.KKK', '...K', 'KKK.'],
  e: ['....', '....', '.KK.', 'K..K', 'KKKK', 'K...', '.KKK'],
  o: ['....', '....', '.KK.', 'K..K', 'K..K', 'K..K', '.KK.'],
  t: ['.K.', '.K.', 'KKK', '.K.', '.K.', '.K.', '.KK'],
  h: ['K...', 'K...', 'KKK.', 'K..K', 'K..K', 'K..K', 'K..K'],
  r: ['....', '....', 'K.KK', 'KK..', 'K...', 'K...', 'K...'],
}

const BUBBLE = [
  '...KKKKKK...', '.KKWWWWWWKK.', 'KWWWWWWWWWWK', 'KWWWWWWWSWWK',
  'KWWWWWWSSWWK', 'KWWSWWSSWWWK', 'KWWSSSSWWWWK', 'KWWWSSWWWWWK',
  '.KKWWWWWWKK.', '..KWKKKKKK..', '..KK........', '..K.........',
]
const SPARK = ['..S..', '..S..', 'SS.SS', '..S..', '..S..']

const CELL_H = 9
const GAP = 1

// Lays a word out left to right and returns its pixels plus its width in cells.
function word(text, bold = 1) {
  const cells = []
  let x = 0
  for (const ch of text) {
    const g = GLYPHS[ch]
    g.forEach((row, y) => [...row].forEach((c, dx) => {
      if (c === 'K') for (let b = 0; b < bold; b++) cells.push([x + dx + b, y])
    }))
    x += g[0].length + bold - 1 + GAP
  }
  return { cells, width: x - GAP }
}

function grid(rows, colors, ox = 0, oy = 0) {
  const out = []
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (colors[c]) out.push(<rect key={`${ox + x}-${oy + y}`} x={ox + x} y={oy + y} width="1" height="1" fill={colors[c]} />)
  }))
  return out
}


const LINE_GAP = 1 // extra rows between the two lines (descender of g already adds 2)

export default function Logo({ px = 2.2, bold = 2 }) {
  const LINE1 = word('Nudge', bold)
  const LINE2 = word('Together', bold)
  const w = LINE2.width + 4 // room for the second sparkle
  const h = CELL_H * 2 + LINE_GAP
  const ink = 'var(--highlight)'
  return (
    <span className="logo-mark" role="img" aria-label="Nudge Together">
      <svg viewBox="0 0 12 12" width={12 * px} height={12 * px} shapeRendering="crispEdges" aria-hidden="true">
        {grid(BUBBLE, { K: 'var(--text)', W: 'var(--bubble-fill)', S: ink })}
      </svg>
      <svg viewBox={`0 -4 ${w + 2} ${h + 4}`} width={(w + 2) * px} height={(h + 4) * px} shapeRendering="crispEdges" aria-hidden="true">
        {LINE1.cells.map(([x, y]) => <rect key={`a${x}-${y}`} x={x} y={y} width="1" height="1" fill={ink} />)}
        {LINE2.cells.map(([x, y]) => <rect key={`b${x}-${y}`} x={x} y={y + CELL_H + LINE_GAP} width="1" height="1" fill={ink} />)}
        {grid(SPARK, { S: 'var(--sparkle)' }, LINE1.width + 2, -4)}
        {grid(['.S.', 'SSS', '.S.'], { S: ink }, LINE2.width + 2, CELL_H + LINE_GAP + 2)}
      </svg>
    </span>
  )
}
