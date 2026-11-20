import { useEffect, useRef, useState } from 'react'

// Mochi the cat: wanders along the bottom of the screen and eats a treat
// every time you finish a task. Mood comes from tasks finished in the last 24h.

const CAT_W = 92
// ---------- pixel art ----------
// Each letter is one pixel. K outline, D/M/L grays, W white, P pink, B blush, N nose.
const COLORS = {
  K: '#2b2a2e', D: '#5e5d63', M: '#8d8c92', L: '#b9b8bd', W: '#f3f0e8',
  P: '#f08377', B: '#e9a3a0', N: '#d9616b',
}
// 26 x 16 body, facing right. Legs are drawn separately so they can step.
const CAT = [
  '...............KK.....KK..',
  '..............KMDK...KDMK.',
  '..............KPMMKKKMMPK.',
  '.............KPPMDMMDMMPPK',
  '.............KMMDMMMMDMMMK',
  '............KMMMMMMMMMMMMK',
  '.KK.........KMMMMMMMMMMMMK',
  'KMDK........KMMMMMMMMMMMMK',
  'KDMK........KBMMMWWNWWMMBK',
  'KMDK........KMMMWWWWWWMMK.',
  '.KMDK........KKMMWWWWMMKK.',
  '..KMDKKKKKKKKMMDKKWWWWK...',
  '..KMMDMMDMMDMMDMKWWWWK....',
  '..KMDMMDMMDMMDMMMWWWWK....',
  '..KMMMMMMMMMMMMMMWWWK.....',
  '...KLLLWWWWWWWLLLLLK......',
]
const LEG = ['KMMK', 'KMMK', 'KWWK', 'KKKK']
const EYES = {
  open: [[15, 6, 'K'], [16, 6, 'W'], [15, 7, 'K'], [16, 7, 'K'], [21, 6, 'K'], [22, 6, 'W'], [21, 7, 'K'], [22, 7, 'K']],
  closed: [[15, 7, 'K'], [16, 7, 'K'], [21, 7, 'K'], [22, 7, 'K']],
  happy: [[14, 7, 'K'], [15, 6, 'K'], [16, 6, 'K'], [17, 7, 'K'], [20, 7, 'K'], [21, 6, 'K'], [22, 6, 'K'], [23, 7, 'K']],
}
const FISH = ['.KKKK..K', 'KLLLLKKL', 'KWLLLLLK', 'KLLLLKKL', '.KKKK..K']
const FISH_COLORS = { K: '#2f4a63', L: '#7fb0d6', W: '#1d2b36' }

function pixels(rows, colors, dx = 0, dy = 0, filter) {
  const out = []
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || (filter && !filter(x, y))) return
    out.push(<rect key={`${x + dx}-${y + dy}`} x={x + dx} y={y + dy} width="1.02" height="1.02" fill={colors[ch]} />)
  }))
  return out
}

const isHead = (x, y) => x >= 12 && y <= 10
const isTail = (x, y) => x <= 4 && y <= 10

function PixelCat({ facing, eyes }) {
  return (
    <svg viewBox="0 0 26 20" shapeRendering="crispEdges" style={{ transform: `scaleX(${facing})` }} aria-hidden="true">
      <g className="tail">{pixels(CAT, COLORS, 0, 0, isTail)}</g>
      <g className="leg leg-a">{pixels(LEG, COLORS, 3, 16)}</g>
      <g className="leg leg-b">{pixels(LEG, COLORS, 8, 16)}</g>
      <g className="leg leg-a">{pixels(LEG, COLORS, 13, 16)}</g>
      <g className="leg leg-b">{pixels(LEG, COLORS, 17, 16)}</g>
      <g className="cat-body">
        {pixels(CAT, COLORS, 0, 0, (x, y) => !isHead(x, y) && !isTail(x, y))}
        <g className="head">
          {pixels(CAT, COLORS, 0, 0, isHead)}
          {EYES[eyes].map(([x, y, c]) => <rect key={`e${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={COLORS[c]} />)}
        </g>
      </g>
    </svg>
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
    const fx = Math.max(10, Math.min(w - 40, Math.random() * (w - 50)))
    setFood(fx)
    // Stand so the mouth lands on the treat.
    const standAt = fx > xRef.current ? fx - 51 : fx - 9
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
        className={`pet ${walking ? 'walking' : ''} ${eating ? 'eating' : ''} ${mood}`}
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
          <PixelCat facing={facing} eyes={asleep ? 'closed' : mood === 'happy' ? 'happy' : 'open'} />
        </button>
      </div>
    </div>
  )
}
