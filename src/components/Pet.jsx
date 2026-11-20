import { useEffect, useRef, useState } from 'react'

// Mochi the cat: wanders along the bottom of the screen and eats a treat
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

export default function Pet({ treats, feedSignal }) {
  const areaRef = useRef(null)
  const [x, setX] = useState(24)
  const [facing, setFacing] = useState(1) // 1 = right, -1 = left
  const [walking, setWalking] = useState(false)
  const [duration, setDuration] = useState(0)
  const [food, setFood] = useState(null) // x position of a dropped treat
  const [eating, setEating] = useState(false)
  const [hearts, setHearts] = useState(0) // bump to replay the hearts
  const [bubble, setBubble] = useState(false)

  const mood = treats >= 3 ? 'happy' : treats >= 1 ? 'content' : 'sleepy'

  // Refs so timers always see the latest values.
  const xRef = useRef(24)
  const walkingRef = useRef(false)
  const busyRef = useRef(false)
  const moodRef = useRef(mood)
  const walkTimer = useRef()
  const timers = useRef([])
  moodRef.current = mood

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id) }
  const areaWidth = () => areaRef.current?.clientWidth ?? 320

  function walkTo(target, onArrive) {
    const t = Math.max(0, Math.min(areaWidth() - CAT_W, target))
    const dist = Math.abs(t - xRef.current)
    const speed = moodRef.current === 'happy' ? 80 : moodRef.current === 'content' ? 55 : 30 // px per second
    const dur = reduceMotion() ? 0 : dist / speed
    if (dist > 1) setFacing(t > xRef.current ? 1 : -1)
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

  // Wander around now and then (less often when sleepy).
  useEffect(() => {
    if (reduceMotion()) return
    const id = setInterval(() => {
      if (busyRef.current || walkingRef.current) return
      const chance = moodRef.current === 'sleepy' ? 0.2 : moodRef.current === 'content' ? 0.5 : 0.75
      if (Math.random() < chance) walkTo(Math.random() * (areaWidth() - CAT_W))
    }, 3500)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A task was completed: drop a treat, walk over, eat it.
  useEffect(() => {
    if (!feedSignal) return
    busyRef.current = true
    setBubble(false)
    const w = areaWidth()
    const fx = Math.max(10, Math.min(w - 34, Math.random() * (w - 44)))
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

  const asleep = mood === 'sleepy' && !walking && !eating
  // Keep the speech bubble on screen near the edges.
  const bubbleSide = x < 70 ? 'left' : x > areaWidth() - CAT_W - 70 ? 'right' : ''

  return (
    <div className="pet-area" ref={areaRef} aria-live="polite">
      {food !== null && (
        <svg className="pet-food" style={{ left: food }} viewBox="0 0 8 5" shapeRendering="crispEdges" aria-hidden="true">
          {pixels(FISH, FISH_COLORS)}
        </svg>
      )}

      <div
        className={`pet face-${facing > 0 ? 'right' : 'left'} ${walking ? 'walking' : ''} ${eating ? 'eating' : ''} ${mood}`}
        style={{ left: x, transitionDuration: `${duration}s` }}
      >
        {bubble && (
          <div className={`pet-bubble ${bubbleSide}`}>
            <strong>Mochi</strong> · {treats} treat{treats === 1 ? '' : 's'} today
            <div className="muted small">{MOOD_LINES[mood]}</div>
          </div>
        )}
        {asleep && <span className="zzz" aria-hidden="true">z</span>}
        {hearts > 0 && (
          <span key={hearts} className="hearts" aria-hidden="true">
            <span>♥</span><span>♥</span><span>♥</span>
          </span>
        )}

        <button className="pet-btn" onClick={poke} aria-label={`Mochi the cat, ${mood}. ${treats} treats today.`}>
          <PixelCat facing={facing} pose={walking ? 'walk' : asleep ? 'loaf' : 'sit'} eyes={eating || mood === 'happy' ? 'happy' : 'open'} />
        </button>
      </div>
    </div>
  )
}


// Exported for previews/tests.
export { PixelCat }
