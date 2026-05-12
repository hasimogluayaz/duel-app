interface Props {
  side: 'sicak' | 'soguk'
  big?: boolean
}

export function SideChip({ side, big = false }: Props) {
  const isSicak = side === 'sicak'
  const label = isSicak ? 'Sıcak' : 'Soğuk'
  const icon = isSicak ? '🔥' : '❄️'
  const dotColor = isSicak ? 'var(--k3-warm-500, #ed6f1c)' : 'var(--k-blue-500, #2a6cf0)'

  return (
    <span
      className={isSicak ? 'k3-side-warm' : 'k3-side-cool'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: big ? 6 : 5,
        padding: big ? '5px 12px' : '2px 9px',
        height: big ? 26 : 22,
        fontSize: big ? 12 : 11,
        fontWeight: 600,
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: big ? 7 : 6,
        height: big ? 7 : 6,
        borderRadius: '50%',
        background: dotColor,
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
