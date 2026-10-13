const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
}

export function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  return (
    <svg
      viewBox="0 0 4 4"
      width={72}
      height={72}
      role="img"
      aria-label={value ? `Die showing ${value}` : 'Die, not rolled yet'}
      className={rolling ? 'die-roll' : undefined}
    >
      <rect x={0.2} y={0.2} width={3.6} height={3.6} rx={0.6} fill="#fff" stroke="#111827" strokeWidth={0.12} />
      {value && PIPS[value].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.28} fill="#111827" />)}
    </svg>
  )
}
