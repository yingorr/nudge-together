import { useEffect, useRef, useState } from 'react'

// 宝宝 the cat: wanders along the bottom of the screen and eats a treat
// every time you finish a task. Mood comes from tasks finished in the last 24h.

const CAT_W = 72
// ---------- pixel art ----------
// Each letter is one pixel. K outline, D/M/L grays, W white, P pink, Y eyes, N nose.
const COLORS = {
  K: '#2a292e', D: '#56555c', M: '#8b8a91', L: '#b3b2b8', W: '#e8e5de',
  P: '#ee8f8a', Y: '#f2c94c', N: '#3a2f33',
}

// Walking: two frames (legs swap). Faces right. 24 x 18.
// Sitting (resting, eating) and loaf (sleeping) face left, so they get flipped.
const WALK_0 = [
  '..............K.....K...',
  '.............KPK...KPK..',
  '.............KPMKKKMPK..',
  '.............KMDMDMDMK..',
  '............KMMMMMMMMMK.',
  '............KMMMMMMMMMK.',
  '...........KKMMMWWWMMMKK',
  '.....KKKKKKKKKMWWNWWMK..',
  '..KKKMDMMDMMMMKKWWWKK...',
  '..KKMMDMMDMMMMMKWWWK....',
  '.KDKMDMMDMMDMMMMWWK.....',
  '.KMKMMMMMMMMMMMMWK......',
  '.KDKKLLLKKKKLLLLLK......',
  '.KMKKMKKDK..KDKMK.......',
  '.KDKKMKKDK..KDKMK.......',
  '..KMKMKKDK..KDKMK.......',
  '...KKMKKKK..KKKMK.......',
  '....KKK.......KKK.......',
]
const WALK_1 = [
  '..............K.....K...',
  '.............KPK...KPK..',
  '.............KPMKKKMPK..',
  '.............KMDMDMDMK..',
  '............KMMMMMMMMMK.',
  '............KMMMMMMMMMK.',
  '...........KKMMMWWWMMMKK',
  '.....KKKKKKKKKMWWNWWMK..',
  '..KKKMDMMDMMMMKKWWWKK...',
  '..KKMMDMMDMMMMMKWWWK....',
  '.KDKMDMMDMMDMMMMWWK.....',
  '.KMKMMMMMMMMMMMMWK......',
  '.KDKKLLLKKKKLLLLLK......',
  '.KMK.KMKK....KMK........',
  '.KDK.KMKK....KMK........',
  '..KMKKMKK....KMK........',
  '...KKKMKK....KMK........',
  '.....KKK.....KKK........',
]
const SIT = [
  '...K.....K........',
  '..KPK...KPK.......',
  '..KPMKKKMPK.......',
  '..KMDMDMDMK.......',
  '.KMMMMMMMMMK......',
  '.KMMMMMMMMMK......',
  'KKMMMWWWMMMKK.....',
  '..KMWWNWWMK.......',
  '...KKWWWKK....KK..',
  '..KMMWWWMMK..KMK..',
  '.KMDMWWWMDMK..KDK.',
  '.KMDKWWWKDMK..KMK.',
  '.KDMKWWWKMDK.KDK..',
  '.KMDKMKMKDMMKKMK..',
  '.KDMKMKMKMDMMDK...',
  '.KMDKMKMKDMMMK....',
  '.KMMKWKWKMMMK.....',
  '..KKKKKKKKKKK.....',
]
const LOAF = [
  '..K.....K...........',
  '.KPK...KPK..........',
  '.KPMKKKMPKKKKKKKK...',
  'KMDMDMDMMKDMMDMMDK..',
  'KMMMMMMMMMKMDMMDMMK.',
  'KMMMMMMMMMKMMDMMDMMK',
  'KKMMWWWMMKKDMMDMMMMK',
  '.KMWWNWWMKMMMDMMDMMK',
  '..KKWWWKKMMDMMMDMMK.',
  '.KLLLLLLLLLLLLLLLK..',
  '..KKKKKKKKKKKKKKK...',
]

const WALK_EYES = [[14, 5, 'W'], [15, 5, 'K'], [14, 6, 'Y'], [15, 6, 'K'], [19, 5, 'W'], [20, 5, 'K'], [19, 6, 'Y'], [20, 6, 'K']]
const SIT_EYES = {
  open: [[3, 4, 'W'], [4, 4, 'K'], [3, 5, 'Y'], [4, 5, 'K'], [7, 4, 'W'], [8, 4, 'K'], [7, 5, 'Y'], [8, 5, 'K']],
  happy: [[2, 5, 'K'], [3, 4, 'K'], [4, 4, 'K'], [5, 5, 'K'], [6, 5, 'K'], [7, 4, 'K'], [8, 4, 'K'], [9, 5, 'K']],
}
const LOAF_EYES = [[2, 5, 'K'], [3, 5, 'K'], [6, 5, 'K'], [7, 5, 'K']]

const FISH = ['.KKKK..K', 'KLLLLKKL', 'KWLLLLLK', 'KLLLLKKL', '.KKKK..K']
const FISH_COLORS = { K: '#2f4a63', L: '#7fb0d6', W: '#1d2b36' }

function pixels(rows, colors, filter) {
  const out = []
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || (filter && !filter(x, y))) return
    out.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={colors[ch]} />)
  }))
  return out
}
const eyeRects = (list) =>
  list.map(([x, y, c]) => <rect key={`e${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />)

function Sprite({ cls, w, h, flip, children }) {
  return (
    <svg className={cls} viewBox={`0 0 ${w} ${h}`} width={w * 3} height={h * 3} shapeRendering="crispEdges"
      style={{ transform: `scaleX(${flip})` }} aria-hidden="true">
      {children}
    </svg>
  )
}

// pose: 'walk' | 'sit' | 'loaf'
function PixelCat({ facing, pose, eyes }) {
  if (pose === 'walk') {
    return (
      <Sprite cls="walk" w={24} h={18} flip={facing}>
        <g className="frame-0">{pixels(WALK_0, COLORS)}</g>
        <g className="frame-1">{pixels(WALK_1, COLORS)}</g>
        {eyeRects(WALK_EYES)}
      </Sprite>
    )
  }
  if (pose === 'loaf') {
    return (
      <Sprite cls="loaf" w={20} h={11} flip={-facing}>
        {pixels(LOAF, COLORS)}
        {eyeRects(LOAF_EYES)}
      </Sprite>
    )
  }
  const isHead = (x, y) => y <= 7
  const isTail = (x, y) => x >= 13 && y >= 8
  return (
    <Sprite cls="sit" w={18} h={18} flip={-facing}>
      <g className="tail">{pixels(SIT, COLORS, isTail)}</g>
      {pixels(SIT, COLORS, (x, y) => !isHead(x, y) && !isTail(x, y))}
      <g className="head">
        {pixels(SIT, COLORS, isHead)}
        {eyeRects(SIT_EYES[eyes === 'happy' ? 'happy' : 'open'])}
      </g>
    </Sprite>
  )
}

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const MOOD_LINES = {
  sleepy: 'Zzz… finish a task to wake me up!',
  content: 'Mmm, tasty. More please!',
  happy: 'So full and happy!',
}

// ---------- the bed ----------
const BED = [
  '....KKKKKKKKKKKKKKKK....',
  '..KKRRRRRRRRRRRRRRRRKK..',
  '.KRRSSSSSSSSSSSSSSSSRRK.',
  'KRRCCCCCCCCCCCCCCCCCCRRK',
  'KRCCCCHHCCCCCCCCCCCCCCRK',
  'KRRCCCCCCCCCCCCCCCCCCRRK',
  '.KRRRRRRRRRRRRRRRRRRRRK.',
  '..KKKKKKKKKKKKKKKKKKKK..',
]
const BED_COLORS = { K: '#2a292e', R: '#6f8f78', S: '#4f6b58', C: '#efe3c8', H: '#fbf6ea' }
const BED_W = 72 // 24 art pixels x 3
const IN_BED_OFFSET = 6 // cat's x inside the bed

// The back of the bed sits behind the cat; the front rim is drawn again on top
// so a sleeping cat looks tucked in.
function Bed({ x }) {
  return (
    <>
      <svg className="pet-bed" style={{ left: x }} viewBox="0 0 24 8" width={BED_W} height={24}
        shapeRendering="crispEdges" aria-hidden="true">{pixels(BED, BED_COLORS)}</svg>
      <svg className="pet-bed front" style={{ left: x }} viewBox="0 5 24 3" width={BED_W} height={9}
        shapeRendering="crispEdges" aria-hidden="true">{pixels(BED, BED_COLORS, (cx, cy) => cy >= 5)}</svg>
    </>
  )
}

// ---------- the cat tree ----------
// Plush perches at two heights, a rope-wrapped post, a cubby and a pom-pom toy.
// Drawn at 3x on wide screens and 2x on phones (so it fits the bottom strip).
const TREE = [
  '...O..O...............',
  '..OOOOOOOO............',
  '.OFFFffFFFO...........',
  '.OFfFFffFFO...........',
  '.OssssssssO...........',
  '..OOOOOOOO............',
  '..T.OPO...............',
  '..T.OPO...............',
  '..T.OPO...............',
  '..T.OPO..O..O..O..O...',
  '..T.OPO.OOOOOOOOOOOOO.',
  '..T.OPOOFffFFfFFffFFFO',
  '..T.OPOOFFFFFFFfFfFFfO',
  '.OQOOPOOsssssssssssssO',
  '.QQQOPO.OOOOOOOOOOOOO.',
  '.OQOOPO.......OPO.....',
  '....OPO.......OPO.....',
  '....OPO.......OPO.....',
  '....OPO.......OPO.....',
  '....OPO....OOOOPOOOO..',
  '...OyyyO...OBBBBBBBO..',
  '...OYYYO...OBBHHHBBO..',
  '...OyyyO...OBHHHHHBO..',
  '...OYYYO...OBHHHHHBO..',
  '...OyyyO...OBBHHHBBO..',
  '...OYYYO...OBBBBBBBO..',
  '...OOPO..O.ObbbbbbbO..',
  '..OOOPOOOOOOOOOOOOOO..',
  '.OFffFFFFfFFfffFFFffO.',
  '.OFFfFFFFFFfFFFfFFFFO.',
  '.OssssssssssssssssssO.',
  '..OOOOOOOOOOOOOOOOOO..',
]
const TREE_COLORS = {
  O: '#7d6b5c', F: '#f1e6cf', f: '#fbf7ec', s: '#ddcca9', P: '#c9b28a', Y: '#e3c47c', y: '#bf9f55',
  B: '#ecdfc2', b: '#d7c7a3', H: '#4a3b35', T: '#8c7a68', Q: '#e9a3a0',
}
const TREE_COLS = 22
const TREE_ROWS = 32
const PERCH_COL = 14.5 // centre of the big middle perch (art pixels from the left)
const PERCH_ROW = 10 // its top surface (art pixels from the top)

function CatTree({ x, scale }) {
  return (
    <svg className="pet-tree" style={{ left: x }} viewBox={`0 0 ${TREE_COLS} ${TREE_ROWS}`}
      width={TREE_COLS * scale} height={TREE_ROWS * scale} shapeRendering="crispEdges" aria-hidden="true">
      {pixels(TREE, TREE_COLORS)}
    </svg>
  )
}

// ---------- where the cat may walk ----------
// Wide screens: only in the empty space left and right of the task column
// (it walks *behind* the column to switch sides). Narrow screens: its own strip.
const WIDE = 960
const COLUMN = 720

function getLayout(areaW) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : areaW
  if (vw >= WIDE) {
    const colLeft = (vw - COLUMN) / 2
    const colRight = colLeft + COLUMN
    const zones = [[12, colLeft - CAT_W - 12], [colRight + 12, vw - CAT_W - 12]].filter(([a, b]) => b > a)
    // bed in the left gap, cat tree in the right gap
    const bedX = Math.max(12, colLeft - BED_W - 40)
    const treeX = Math.min(vw - TREE_COLS * 3 - 12, colRight + 40)
    return { wide: true, treeX, treeScale: 3, bedX, zones }
  }
  // bed on the left end of the strip, cat tree on the right end
  return { wide: false, treeX: areaW - TREE_COLS * 2 - 6, treeScale: 2, bedX: 8, zones: [[0, areaW - CAT_W - 4]] }
}

const randomIn = ([a, b]) => a + Math.random() * (b - a)

export default function Pet({ treats, feedSignal }) {
  const areaRef = useRef(null)
  const [layout, setLayout] = useState(() => getLayout(typeof window !== 'undefined' ? window.innerWidth : 390))
  const [x, setX] = useState(layout.bedX + IN_BED_OFFSET)
  const [facing, setFacing] = useState(-1) // 1 = right, -1 = left
  const [walking, setWalking] = useState(false)
  const [duration, setDuration] = useState(0)
  const [inBed, setInBed] = useState(true)
  const [food, setFood] = useState(null) // x position of a dropped treat
  const [eating, setEating] = useState(false)
  const [hearts, setHearts] = useState(0) // bump to replay the hearts
  const [bubble, setBubble] = useState(false)
  const [perched, setPerched] = useState(false) // sitting up on the cat tree

  const mood = treats >= 3 ? 'happy' : treats >= 1 ? 'content' : 'sleepy'

  // Refs so timers always see the latest values.
  const xRef = useRef(x)
  const walkingRef = useRef(false)
  const busyRef = useRef(false)
  const inBedRef = useRef(true)
  const moodRef = useRef(mood)
  const layoutRef = useRef(layout)
  const walkTimer = useRef()
  const timers = useRef([])
  moodRef.current = mood
  layoutRef.current = layout

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id) }
  const areaWidth = () => areaRef.current?.clientWidth ?? 390

  // Re-measure on resize; if the cat ends up somewhere it shouldn't be, send it to bed.
  useEffect(() => {
    const measure = () => {
      const l = getLayout(areaWidth())
      setLayout(l)
      layoutRef.current = l
      const ok = inBedRef.current || l.zones.some(([a, b]) => xRef.current >= a - 1 && xRef.current <= b + 1)
      if (!ok || inBedRef.current) {
        xRef.current = l.bedX + IN_BED_OFFSET
        setDuration(0)
        setX(xRef.current)
        inBedRef.current = true
        setInBed(true)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function walkTo(target, onArrive) {
    const t = Math.max(0, target)
    const dist = Math.abs(t - xRef.current)
    const speed = moodRef.current === 'happy' ? 80 : moodRef.current === 'content' ? 55 : 30 // px per second
    const dur = reduceMotion() ? 0 : dist / speed
    if (dist > 1) setFacing(t > xRef.current ? 1 : -1)
    inBedRef.current = false
    setInBed(false)
    setPerched(false)
    setDuration(dur)
    setWalking(dur > 0)
    walkingRef.current = dur > 0
    setX(t)
    xRef.current = t
    clearTimeout(walkTimer.current)
    walkTimer.current = setTimeout(() => {
      setWalking(false)
      walkingRef.current = false
      onArrive?.()
    }, dur * 1000)
  }

  function goToBed() {
    walkTo(layoutRef.current.bedX + IN_BED_OFFSET, () => {
      setFacing(-1)
      inBedRef.current = true
      setInBed(true)
    })
  }

  // Wide screens: walk to the cat tree and hop up onto the big perch to sit.
  // (On phones the perch would poke up over the task list, so it stays down.)
  function climbTree() {
    const l = layoutRef.current
    if (!l.wide) return
    walkTo(l.treeX + PERCH_COL * l.treeScale - 27, () => {
      setFacing(-1)
      setPerched(true)
    })
  }

  // Wander now and then. Sleepy: head to bed and stay there.
  useEffect(() => {
    if (reduceMotion()) return
    const id = setInterval(() => {
      if (busyRef.current || walkingRef.current) return
      if (moodRef.current === 'sleepy') {
        if (!inBedRef.current) goToBed()
        return
      }
      const r = Math.random()
      const chance = moodRef.current === 'content' ? 0.5 : 0.75
      if (r < 0.08) goToBed() // the occasional nap spot visit
      else if (r < 0.2) climbTree()
      else if (r < chance) {
        const zones = layoutRef.current.zones
        walkTo(randomIn(zones[Math.floor(Math.random() * zones.length)]))
      }
    }, 3500)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A task was completed: drop a treat near the cat (in an allowed spot), walk over, eat it.
  useEffect(() => {
    if (!feedSignal) return
    busyRef.current = true
    setBubble(false)
    const zones = layoutRef.current.zones
    // the zone the cat is in (or nearest to it)
    const zone = zones.reduce((best, z) =>
      Math.abs((z[0] + z[1]) / 2 - xRef.current) < Math.abs((best[0] + best[1]) / 2 - xRef.current) ? z : best)
    const fx = Math.max(zone[0] + 4, Math.min(zone[1] + CAT_W - 30, randomIn([zone[0], zone[1] + CAT_W - 26])))
    setFood(fx)
    // Stand so the mouth lands on the treat.
    const standAt = fx > xRef.current ? fx - 39 : fx - 7
    later(() => {
      walkTo(standAt, () => {
        setFacing(fx > xRef.current + CAT_W / 2 ? 1 : -1)
        setEating(true)
        later(() => {
          setFood(null)
          setEating(false)
          setHearts((h) => h + 1)
          busyRef.current = false
        }, 1400)
      })
    }, 450)
  }, [feedSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    clearTimeout(walkTimer.current)
    timers.current.forEach(clearTimeout)
  }, [])

  function poke() {
    setBubble(true)
    later(() => setBubble(false), 3500)
  }

  const asleep = mood === 'sleepy' && inBed && !walking && !eating
  // Keep the speech bubble on screen near the edges.
  const bubbleSide = x < 70 ? 'left' : x > areaWidth() - CAT_W - 70 ? 'right' : ''

  return (
    <div className={`pet-area ${layout.wide ? 'wide' : 'strip'}`} ref={areaRef} aria-live="polite">
      <CatTree x={layout.treeX} scale={layout.treeScale} />
      <Bed x={layout.bedX} />

      {food !== null && (
        <svg className="pet-food" style={{ left: food }} viewBox="0 0 8 5" shapeRendering="crispEdges" aria-hidden="true">
          {pixels(FISH, FISH_COLORS)}
        </svg>
      )}

      <div
        className={`pet face-${facing > 0 ? 'right' : 'left'} ${walking ? 'walking' : ''} ${eating ? 'eating' : ''} ${inBed && !walking ? 'in-bed' : ''} ${perched && !walking ? 'perched' : ''} ${mood}`}
        style={{ left: x, transitionDuration: `${duration}s` }}
      >
        {bubble && (
          <div className={`pet-bubble ${bubbleSide}`}>
            <strong>宝宝</strong> · {treats} treat{treats === 1 ? '' : 's'} today
            <div className="muted small">{MOOD_LINES[mood]}</div>
          </div>
        )}
        {asleep && <span className="zzz" aria-hidden="true">z</span>}
        {hearts > 0 && (
          <span key={hearts} className="hearts" aria-hidden="true">
            <span>♥</span><span>♥</span><span>♥</span>
          </span>
        )}

        <button className="pet-btn" onClick={poke} aria-label={`宝宝 the cat, ${mood}. ${treats} treats today.`}>
          <PixelCat facing={facing} pose={walking ? 'walk' : asleep ? 'loaf' : 'sit'} eyes={eating || mood === 'happy' ? 'happy' : 'open'} />
        </button>
      </div>
    </div>
  )
}

// Exported for previews/tests.
export { PixelCat }
