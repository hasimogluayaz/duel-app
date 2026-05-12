// Kapisio — shared components (icons, badges, buttons, cards)
// Loaded as type="text/babel". Exports to window.

// ─────────────────────────────────────────────────────────────────────────────
// Icons (Lucide-style, hand-tuned, 1.5 stroke)
// ─────────────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 18, stroke = 'currentColor', fill = 'none', sw = 1.75, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);
const Icons = {
  home:     (p) => <Ic {...p} d={<><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14V10.5"/></>}/>,
  compass:  (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.5 5.5-5.5 2.5 2.5-5.5 5.5-2.5Z"/></>}/>,
  archive:  (p) => <Ic {...p} d={<><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></>}/>,
  bell:     (p) => <Ic {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 7H4s2-2 2-7Z"/><path d="M10 20a2 2 0 0 0 4 0"/></>}/>,
  msg:      (p) => <Ic {...p} d={<><path d="M21 11.5a8 8 0 0 1-12.4 6.7L3 20l1.8-5.6A8 8 0 1 1 21 11.5Z"/></>}/>,
  trophy:   (p) => <Ic {...p} d={<><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a3 3 0 0 0 3 3"/><path d="M16 6h3v2a3 3 0 0 1-3 3"/><path d="M10 14h4l1 6H9l1-6Z"/></>}/>,
  bookmark: (p) => <Ic {...p} d="M6 4h12v17l-6-4-6 4V4Z"/>,
  user:     (p) => <Ic {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}/>,
  settings: (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></>}/>,
  plus:     (p) => <Ic {...p} d="M12 5v14M5 12h14"/>,
  search:   (p) => <Ic {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  moon:     (p) => <Ic {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6 6 0 0 0 10.5 10.5Z"/>,
  shield:   (p) => <Ic {...p} d={<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></>}/>,
  flame:    (p) => <Ic {...p} sw={1.6} fill="currentColor" stroke="none"
                       d="M12 2c1 3 3 4 3 7a3 3 0 1 1-6 0c0-1 .4-1.7 1-2.5C7 8 5 10 5 14a7 7 0 0 0 14 0c0-5-4-8-7-12Z"/>,
  bolt:     (p) => <Ic {...p} fill="currentColor" stroke="none" d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>,
  target:   (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>}/>,
  swords:   (p) => <Ic {...p} d={<><path d="m14.5 17.5 5-5L21 14l-5 5-1.5-1.5Z"/><path d="m3 21 4-4M4 4l8 8M20 4l-8 8M3 21l1-1"/></>}/>,
  arrowUp:  (p) => <Ic {...p} sw={2} d="M5 14l7-7 7 7"/>,
  arrowDown:(p) => <Ic {...p} sw={2} d="M5 10l7 7 7-7"/>,
  arrowRight:(p) => <Ic {...p} d="M5 12h14M13 6l6 6-6 6"/>,
  share:    (p) => <Ic {...p} d={<><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8 10.5 7.5-4.5M8 13.5l7.5 4.5"/></>}/>,
  more:     (p) => <Ic {...p} d={<><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></>}/>,
  reply:    (p) => <Ic {...p} d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5"/>,
  check:    (p) => <Ic {...p} d="M5 12.5 10 17 19 8"/>,
  clock:    (p) => <Ic {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}/>,
  externalLink: (p) => <Ic {...p} d={<><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>}/>,
  egg:      (p) => <Ic {...p} sw={1.6} d={<><path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11Z"/></>}/>,
  chevronRight:(p)=> <Ic {...p} d="m9 6 6 6-6 6"/>,
  x:        (p) => <Ic {...p} d="M6 6l12 12M18 6 6 18"/>,
  filter:   (p) => <Ic {...p} d="M4 5h16l-6 8v6l-4-2v-4L4 5Z"/>,
};

// ─────────────────────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────────────────────
const KapisioLogo = ({ size = 28, color = 'var(--k-blue-500)', withWordmark = true }) => (
  <div style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Kapisio">
      <rect x="2" y="2" width="28" height="28" rx="7" fill={color}/>
      <path d="M10 8v16M10 16l6-6M10 16l8 8" stroke="#fff" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="22" cy="9" r="2" fill="#fff"/>
    </svg>
    {withWordmark && (
      <span style={{ fontWeight: 700, fontSize: size * 0.7, color: 'var(--k-text)',
                     letterSpacing: '-0.02em' }}>Kapisio</span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
const Avatar = ({ name, color = '#2a6cf0', size = 36, ring, badge }) => {
  const initials = name?.length <= 2 ? name : (name?.[0] || '?').toUpperCase();
  return (
    <span style={{ position:'relative', display:'inline-flex' }}>
      <span className="k-avatar" style={{
        width: size, height: size, background: color,
        fontSize: Math.max(11, size * 0.4),
        boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 0 4px var(--k-bg-elev)` : 'none',
      }}>{initials}</span>
      {badge && (
        <span style={{
          position:'absolute', right:-2, bottom:-2, width:18, height:18,
          background:'var(--k-bg-elev)', borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 11, boxShadow:'0 1px 3px rgba(0,0,0,.15)',
        }}>{badge}</span>
      )}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mode chip — Senaryo / Emoji / Karakter / Tartışma
// ─────────────────────────────────────────────────────────────────────────────
const ModeChip = ({ mode, size = 'sm' }) => {
  const info = window.MODE_INFO[mode] || window.MODE_INFO.senaryo;
  const isLg = size === 'lg';
  return (
    <span className="k-mode" style={{
      background: `color-mix(in oklab, ${info.color} 12%, white)`,
      color: info.color,
      height: isLg ? 26 : 22,
      padding: isLg ? '0 10px' : '0 8px',
      fontSize: isLg ? 12 : 11,
    }}>
      <span className="k-mode-dot" style={{ background: info.color }}/>
      {info.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Vote rail (Reddit-style up/down, but cleaner) — works horizontal or vertical
// ─────────────────────────────────────────────────────────────────────────────
const VoteRail = ({ score, dir = 'col', myVote, onVote, compact }) => {
  const isCol = dir === 'col';
  const fmt = (n) => n >= 1000 ? (n/1000).toFixed(1) + 'k' : n;
  const btnStyle = (active, color) => ({
    width: compact ? 24 : 28, height: compact ? 24 : 28,
    display:'flex', alignItems:'center', justifyContent:'center',
    borderRadius: 8, background: active ? color + '18' : 'transparent',
    color: active ? color : 'var(--k-text-3)',
    border: 'none', cursor:'pointer', transition:'background .12s, color .12s',
  });
  return (
    <div style={{
      display:'flex', flexDirection: isCol ? 'column' : 'row',
      alignItems:'center', gap: 2, userSelect:'none',
    }}>
      <button onClick={() => onVote?.(myVote === 'up' ? null : 'up')}
              style={btnStyle(myVote === 'up', '#16a34a')} aria-label="Yukarı oyla">
        <Icons.arrowUp size={16}/>
      </button>
      <span style={{
        font: '600 13px var(--k-font-mono)',
        color: myVote === 'up' ? '#16a34a' : myVote === 'down' ? 'var(--k-coral-500)' : 'var(--k-text-2)',
        minWidth: compact ? 32 : 36, textAlign:'center',
        padding: isCol ? '2px 0' : '0 4px',
      }}>{fmt(score + (myVote === 'up' ? 1 : myVote === 'down' ? -1 : 0))}</span>
      <button onClick={() => onVote?.(myVote === 'down' ? null : 'down')}
              style={btnStyle(myVote === 'down', '#1c2f6e')} aria-label="Aşağı oyla">
        <Icons.arrowDown size={16}/>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SoftButton — for like / reply / share stat buttons under cards
// ─────────────────────────────────────────────────────────────────────────────
const StatBtn = ({ icon, label, onClick, active, color = 'var(--k-text-2)' }) => (
  <button onClick={onClick} style={{
    display:'inline-flex', alignItems:'center', gap: 6,
    height: 30, padding: '0 10px', borderRadius: 8,
    background: active ? color + '12' : 'transparent',
    color: active ? color : 'var(--k-text-2)',
    border: 'none', font:'500 12.5px var(--k-font-sans)',
    cursor:'pointer', transition:'background .12s, color .12s',
  }}>
    {icon}
    {label && <span>{label}</span>}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Rank pill (small text with emoji)
// ─────────────────────────────────────────────────────────────────────────────
const RankPill = ({ rank, icon }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    font:'500 11px var(--k-font-sans)', color:'var(--k-text-3)',
  }}>
    <span style={{ fontSize: 12 }}>{icon}</span>
    <span>{rank}</span>
  </span>
);

// Helper: format vote split bar
const VoteSplitBar = ({ left, right, leftLabel, rightLabel, leftColor='var(--k-coral-500)', rightColor='var(--k-blue-500)' }) => (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between',
                  font:'500 11px var(--k-font-mono)', color:'var(--k-text-3)', marginBottom: 6 }}>
      <span style={{ color: leftColor }}>{leftLabel} {left}%</span>
      <span style={{ color: rightColor }}>{rightLabel} {right}%</span>
    </div>
    <div style={{ display:'flex', height: 6, borderRadius: 99, overflow:'hidden', background:'var(--k-bg-soft)' }}>
      <div style={{ width: left+'%',  background: leftColor }}/>
      <div style={{ width: right+'%', background: rightColor }}/>
    </div>
  </div>
);

// Section title (used in right rail, profile, etc.)
const SectionTitle = ({ children, action }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding: '0 4px 8px', marginBottom: 4 }}>
    <span style={{
      font:'600 11px var(--k-font-sans)', letterSpacing:'.08em',
      color:'var(--k-text-3)', textTransform:'uppercase',
    }}>{children}</span>
    {action}
  </div>
);

Object.assign(window, {
  Icons, KapisioLogo, Avatar, ModeChip, VoteRail, StatBtn, RankPill, VoteSplitBar, SectionTitle,
});
