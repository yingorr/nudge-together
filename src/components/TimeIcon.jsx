// Pixel pie for "time needed": a quarter, half or full circle, drawn in the text color.
const RING = ['..KKKK..', '.K....K.', 'K......K', 'K......K', 'K......K', 'K......K', '.K....K.', '..KKKK..']
const filled = (level, x, y) =>
  level === 'high' || (level === 'medium' && x >= 4) || (level === 'low' && x >= 4 && y < 4)

export default function TimeIcon({ level, size = 14 }) {
  const cells = []
  RING.forEach((row, y) => [...row].forEach((c, x) => {
    const inside = c === '.' && y > 0 && y < 7 && x > 0 && x < 7 && !((y === 1 || y === 6) && (x === 1 || x === 6))
    if (c === 'K' || (inside && filled(level, x, y))) cells.push([x, y])
  }))
  return (
    <svg className="time-icon" viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="currentColor" />)}
    </svg>
  )
}
