import { useEffect, useRef, useState } from 'react'

// Mochi the cat: wanders along the bottom of the screen and eats a treat
// every time you finish a task. Mood comes from tasks finished in the last 24h.

const CAT_W = 64
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
    const fx = Math.max(10, Math.min(w - 30, Math.random() * (w - 40)))
    setFood(fx)
    // Stand so the mouth lands on the treat.
    const standAt = fx > xRef.current ? fx - CAT_W + 14 : fx - 6
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
        <svg className="pet-food" style={{ left: food }} viewBox="0 0 24 14" aria-hidden="true">
          <path d="M2 7 Q8 0 16 7 Q8 14 2 7 Z" fill="#7fa7c9" stroke="#3d5a73" strokeWidth="1" />
          <path d="M16 7 L22 2 L22 12 Z" fill="#7fa7c9" stroke="#3d5a73" strokeWidth="1" />
          <circle cx="6" cy="6" r="1" fill="#1d2b36" />
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
          <svg viewBox="0 0 64 48" style={{ transform: `scaleX(${facing})` }} aria-hidden="true">
            {/* tail */}
            <path className="tail" d="M14 30 C4 28 4 14 10 10" fill="none" stroke="#d98a4a" strokeWidth="5" strokeLinecap="round" />
            {/* legs (back pair, front pair) */}
            <g fill="#e89a5c" stroke="#7a4a26" strokeWidth="1.2">
              <rect className="leg leg-a" x="15" y="36" width="6" height="10" rx="3" />
              <rect className="leg leg-b" x="22" y="36" width="6" height="10" rx="3" />
              <rect className="leg leg-b" x="36" y="36" width="6" height="10" rx="3" />
              <rect className="leg leg-a" x="43" y="36" width="6" height="10" rx="3" />
            </g>
            <g className="cat-body">
              {/* body */}
              <ellipse cx="31" cy="31" rx="19" ry="11" fill="#f0a868" stroke="#7a4a26" strokeWidth="1.4" />
              <ellipse cx="33" cy="36" rx="11" ry="5" fill="#fbe3c6" />
              <path d="M24 21 q2 5 0 9 M31 20 q2 5 0 10 M38 21 q2 5 0 9" stroke="#d98a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
              {/* head */}
              <g className="head">
                <path d="M41 14 L43 3 L49 11 Z" fill="#f0a868" stroke="#7a4a26" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M53 11 L58 3 L59 15 Z" fill="#f0a868" stroke="#7a4a26" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M44 9 L45 5 L47 9 Z M55 9 L57 6 L57 11 Z" fill="#f4b6b6" />
                <circle cx="50" cy="20" r="11" fill="#f0a868" stroke="#7a4a26" strokeWidth="1.4" />
                <path d="M47 10 q1 3 0 5 M51 10 q1 3 0 5" stroke="#d98a4a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                {asleep ? (
                  <g stroke="#3b2414" strokeWidth="1.4" strokeLinecap="round" fill="none">
                    <path d="M44 19 q2 2 4 0" /><path d="M52 19 q2 2 4 0" />
                  </g>
                ) : mood === 'happy' ? (
                  <g stroke="#3b2414" strokeWidth="1.6" strokeLinecap="round" fill="none">
                    <path d="M44 20 q2 -3 4 0" /><path d="M52 20 q2 -3 4 0" />
                  </g>
                ) : (
                  <g fill="#3b2414">
                    <circle cx="46" cy="19" r="1.8" /><circle cx="54" cy="19" r="1.8" />
                  </g>
                )}
                <circle cx="43.5" cy="23.5" r="1.8" fill="#f4a3a3" opacity="0.7" />
                <circle cx="56.5" cy="23.5" r="1.8" fill="#f4a3a3" opacity="0.7" />
                <path d="M49 22.5 L51 22.5 L50 24 Z" fill="#c2566b" />
                <path d="M50 24 q-1.5 2 -3 1 M50 24 q1.5 2 3 1" stroke="#3b2414" strokeWidth="1" fill="none" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </button>
      </div>
    </div>
  )
}
