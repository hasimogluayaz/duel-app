// Kapisio v2 — editorial screens (Home, Detail Arena, Discover, Leaderboard, Profile)
// Re-uses Icons / Avatar / ModeChip from components.jsx and data from data.jsx.

const { useState: useS2, useMemo: useM2 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Side helpers — Sıcak (warm) vs Soğuk (cool)
// ─────────────────────────────────────────────────────────────────────────────
const sideColor = (side) => side === 'sicak' ? 'var(--k2-warm-500)' : 'var(--k2-cool-500)';
const sideTone  = (side) => side === 'sicak' ? 'k2-side-warm'        : 'k2-side-cool';
const sideLabel = (side) => side === 'sicak' ? 'SICAK'               : 'SOĞUK';

const SideChip = ({ side, big }) => (
  <span className={sideTone(side)} style={{
    display:'inline-flex', alignItems:'center', gap: 6,
    padding: big ? '5px 11px' : '3px 9px',
    borderRadius: 999, font: `700 ${big?12:10.5}px/1 var(--k2-sans)`,
    letterSpacing: '0.1em',
  }}>
    <span style={{ width: big?7:6, height: big?7:6, borderRadius:'50%', background: sideColor(side) }}/>
    {sideLabel(side)}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// TUG-OF-WAR — animated split, with rope marker
// ─────────────────────────────────────────────────────────────────────────────
const TugBar = ({ warm, cool, big }) => {
  const offset = warm - 50; // -50…50, positive = warm winning
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: big?10:7 }}>
        <span style={{ font: `700 ${big?15:13}px/1 var(--k2-sans)`, color:'var(--k2-warm-700)' }}>
          Sıcak <span className="k2-tab" style={{ font:`500 ${big?13:11}px/1 var(--k2-mono)`, color:'var(--k2-warm-500)', marginLeft: 4 }}>{warm}%</span>
        </span>
        <span style={{ font:`500 11px/1 var(--k2-mono)`, color:'var(--k2-ink-3)' }}>
          {offset > 0 ? `Sıcak +${offset}` : offset < 0 ? `Soğuk +${-offset}` : 'Berabere'}
        </span>
        <span style={{ font: `700 ${big?15:13}px/1 var(--k2-sans)`, color:'var(--k2-cool-700)' }}>
          <span className="k2-tab" style={{ font:`500 ${big?13:11}px/1 var(--k2-mono)`, color:'var(--k2-cool-500)', marginRight: 4 }}>{cool}%</span> Soğuk
        </span>
      </div>
      <div style={{
        position:'relative', height: big?14:10, borderRadius: 99, overflow:'hidden',
        background: 'var(--k2-paper-3)',
      }}>
        <div style={{ position:'absolute', inset: 0, display:'flex' }}>
          <div style={{ width: warm+'%', background:'linear-gradient(90deg, var(--k2-warm-400), var(--k2-warm-500))' }}/>
          <div style={{ flex:1, background:'linear-gradient(90deg, var(--k2-cool-500), var(--k-blue-400))' }}/>
        </div>
        {/* center rope marker */}
        <div style={{
          position:'absolute', top: -2, bottom: -2, left: warm+'%',
          width: 3, background: 'var(--k2-ink)', transform:'translateX(-1.5px)',
          borderRadius: 2, boxShadow:'0 0 0 2px #fff',
        }}/>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDITORIAL HERO — Today's case
// ─────────────────────────────────────────────────────────────────────────────
const EditorialHero = ({ vp, scenario, edition, onOpen }) => {
  const isMobile = vp === 'mobile';
  return (
    <section className="k2-card" style={{
      padding: isMobile ? 18 : 28, position:'relative', overflow:'hidden',
    }}>
      {/* Folio bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap: 10, paddingBottom: isMobile ? 12 : 14,
        borderBottom: '1px solid var(--k2-ink)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
          <span className="k2-eyebrow" style={{ color:'var(--k2-ink)' }}>Sayı № {edition}</span>
          <span style={{ width: 3, height: 3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <span className="k2-eyebrow">11 Mayıs 2026, Pazartesi</span>
          <span style={{ width: 3, height: 3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <span className="k2-eyebrow" style={{ color: 'var(--k2-warm-600)' }}>Günün Davası</span>
        </div>
        <div className="k2-tab" style={{
          display:'inline-flex', alignItems:'center', gap: 6,
          font:'500 12px/1 var(--k2-mono)', color: 'var(--k2-ink-2)',
          padding:'5px 10px', borderRadius: 99, background:'var(--k2-paper-2)',
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--k2-warm-500)' }}/>
          Yenilenmeye {scenario.countdown}
        </div>
      </div>

      {/* Headline */}
      <h2 className="k2-display" style={{
        margin: isMobile ? '16px 0 14px' : '20px 0 18px',
        fontSize: isMobile ? 30 : 44, lineHeight: 1.08,
        color: 'var(--k2-ink)', textWrap:'balance',
      }}>
        {scenario.title.split(',').map((p,i,a) => (
          <span key={i}>{p}{i<a.length-1 && <span style={{ color:'var(--k2-warm-500)' }}>,</span>}</span>
        ))}
      </h2>

      {/* Tug of war */}
      <div style={{ margin: isMobile ? '8px 0 16px' : '8px 0 22px' }}>
        <TugBar warm={scenario.voteSplit.sicak} cool={scenario.voteSplit.soguk} big={!isMobile}/>
      </div>

      {/* Status row — answered + CTAs */}
      <div style={{
        display:'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: 12, alignItems: isMobile ? 'stretch' : 'center',
        padding: isMobile ? 12 : '14px 18px',
        borderRadius: 12, background:'var(--k2-paper-2)',
      }}>
        {scenario.answered ? (
          <div style={{ flex:1, minWidth:0, display:'flex', gap: 10, alignItems:'center' }}>
            <SideChip side={scenario.side} big/>
            <div style={{ minWidth:0 }}>
              <div className="k2-eyebrow" style={{ marginBottom: 3 }}>Cevabın</div>
              <div className="k2-display" style={{
                font: '500 18px/1.25 var(--k2-display)', color:'var(--k2-ink)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isMobile?'normal':'nowrap',
              }}>"{scenario.yourAnswer}"</div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, font:'500 14px var(--k2-sans)', color:'var(--k2-ink-2)' }}>
            Tarafını seç, görüşünü yaz — topluluk hakem.
          </div>
        )}
        <div style={{ display:'flex', gap: 8, flexShrink: 0 }}>
          <button className="k2-btn k2-btn-ink" onClick={onOpen} style={{ flex: isMobile?1:'unset' }}>
            <Icons.swords size={16}/> Hızlı düello
          </button>
          <button className="k2-btn k2-btn-paper" onClick={onOpen} style={{ flex: isMobile?1:'unset' }}>
            {scenario.answersCount} cevap <Icons.arrowRight size={14}/>
          </button>
        </div>
      </div>

      {/* Live participation strip */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginTop: 14, font:'500 12px var(--k2-sans)', color:'var(--k2-ink-3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <span className="k2-tab"><strong style={{ color:'var(--k2-ink)' }}>{scenario.answersCount.toLocaleString('tr-TR')}</strong> cevap</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <span className="k2-tab"><strong style={{ color:'var(--k2-warm-600)' }}>{scenario.duellosLive}</strong> aktif düello</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <span className="k2-tab"><strong style={{ color:'var(--k2-ink)' }}>1.4k</strong> oy</span>
        </div>
        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
            <div style={{ display:'flex' }}>
              {['#d96a1c','#2a6cf0','#1442a8','#1f8df0'].map((c,i)=>(
                <span key={i} style={{
                  width: 22, height: 22, borderRadius:'50%', background:c, border:'2px solid #fff',
                  marginLeft: i?-7:0, font:'600 9px/1 var(--k2-sans)', color:'#fff',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                }}>{['EH','MY','ZA','LK'][i]}</span>
              ))}
            </div>
            <span>+243 katıldı</span>
          </div>
        )}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARD v2 — denser, side-aware
// ─────────────────────────────────────────────────────────────────────────────
const FeedCardV2 = ({ item, vp, onOpen }) => {
  const isMobile = vp === 'mobile';
  const isDuel = item.kind === 'duel';
  return (
    <article className="k2-card" style={{
      padding: isMobile ? 16 : 18, cursor:'pointer',
      transition:'border-color .12s, transform .12s',
    }} onClick={() => onOpen?.(item)}>
      {/* Meta line */}
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
        <ModeChip mode={item.mode}/>
        <div style={{ display:'flex', alignItems:'center', gap: 7, minWidth: 0, flex: 1 }}>
          {isDuel ? (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <span style={{ font:'600 13px var(--k2-sans)', color:'var(--k2-ink)' }}>{item.author.name}</span>
              <span style={{ font:'400 12px var(--k2-display)', fontStyle:'italic', color:'var(--k2-ink-3)' }}>vs</span>
              <Avatar name={item.vs.avatar} color={item.vs.color} size={22}/>
              <span style={{ font:'600 13px var(--k2-sans)', color:'var(--k2-ink)',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth: 0 }}>{item.vs.name}</span>
            </>
          ) : (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <span style={{ font:'600 13px var(--k2-sans)', color:'var(--k2-ink)' }}>{item.author.name}</span>
              <span style={{ font:'400 12px var(--k2-mono)', color:'var(--k2-ink-3)' }}>· {item.time}</span>
            </>
          )}
        </div>
        <button onClick={(e)=>e.stopPropagation()} style={{
          background:'none', border:'none', color:'var(--k2-ink-3)', padding: 4, cursor:'pointer',
        }}><Icons.more size={16}/></button>
      </div>

      {/* Headline — display serif */}
      <h3 className="k2-display" style={{
        margin: '0 0 10px', fontSize: isMobile?18:20, lineHeight: 1.25,
        color:'var(--k2-ink)', textWrap:'pretty',
      }}>{item.title}</h3>

      {/* Preview */}
      {item.preview && (
        <p style={{
          margin:'0 0 12px', font:'400 13.5px/1.55 var(--k2-sans)',
          color:'var(--k2-ink-2)', display:'-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>{item.preview}</p>
      )}

      {/* Duel mini split */}
      {isDuel && (
        <div style={{ margin:'2px 0 12px' }}>
          <TugBar warm={46} cool={54}/>
        </div>
      )}

      {/* Footer stats — tabular */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14, font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }} className="k2-tab">
          {!isDuel && (
            <span style={{ color: item.vote.percent > 70 ? 'var(--k-success)' : 'var(--k2-ink-2)' }}>
              <Icons.arrowUp size={12} style={{verticalAlign:'-1px'}}/> {item.vote.up.toLocaleString('tr-TR')}
            </span>
          )}
          {isDuel && (
            <span style={{ color: 'var(--k2-warm-600)' }}>
              <Icons.target size={12} style={{verticalAlign:'-1px'}}/> {item.stats.votes} oy
            </span>
          )}
          <span><Icons.msg size={12} style={{verticalAlign:'-1px'}}/> {item.stats.answers}</span>
          <span><Icons.flame size={12} style={{verticalAlign:'-1px', color:'var(--k2-warm-500)'}}/> {item.stats.fire}</span>
          {!isDuel && <span style={{ color: 'var(--k2-ink-3)' }}>· {item.time}</span>}
        </div>
        <div style={{ display:'flex', gap: 4 }}>
          <button onClick={(e)=>e.stopPropagation()} style={{ background:'none', border:'none', color:'var(--k2-ink-3)', padding: 4, cursor:'pointer' }}>
            <Icons.bookmark size={15}/>
          </button>
          <button onClick={(e)=>e.stopPropagation()} style={{ background:'none', border:'none', color:'var(--k2-ink-3)', padding: 4, cursor:'pointer' }}>
            <Icons.share size={15}/>
          </button>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME v2
// ─────────────────────────────────────────────────────────────────────────────
const HomeScreenV2 = ({ vp, data, onOpenScenario, edition }) => {
  const isMobile = vp === 'mobile';
  const [filter, setFilter] = useS2('top');
  const filters = [
    { id:'top',    l:'En çok oylanan' },
    { id:'new',    l:'Yeni' },
    { id:'duels',  l:'Düellolar' },
    { id:'follow', l:'Takip' },
    { id:'mode',   l:'Mod' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 14 : 18 }}>
      <EditorialHero vp={vp} scenario={data.todayScenario} edition={edition}
                     onOpen={() => onOpenScenario(data.todayScenario)}/>

      {/* Filter rail */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent: isMobile ? 'flex-start' : 'space-between',
        gap: 10, overflowX: isMobile ? 'auto' : 'visible',
      }}>
        <div style={{ display:'flex', gap: 6 }}>
          {filters.map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{
              padding:'7px 14px', borderRadius: 999, whiteSpace:'nowrap',
              border:'1px solid ' + (filter===f.id ? 'var(--k2-ink)' : 'var(--k2-rule)'),
              background: filter===f.id ? 'var(--k2-ink)' : 'transparent',
              color: filter===f.id ? '#fff' : 'var(--k2-ink-2)',
              font:`${filter===f.id?600:500} 12.5px var(--k2-sans)`, cursor:'pointer',
            }}>{f.l}</button>
          ))}
        </div>
        {!isMobile && (
          <span className="k2-eyebrow">Topluluk akışı · canlı</span>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {data.feed.map(it => <FeedCardV2 key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>)}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL — ARENA (two columns: Sıcak | Soğuk)
// ─────────────────────────────────────────────────────────────────────────────
const ArenaAnswer = ({ a, vp, compact }) => {
  const [vote, setVote] = useS2(null);
  const tone = sideColor(a.side);
  return (
    <article style={{
      padding: compact ? 12 : 14, borderRadius: 12,
      background: '#fff', border: '1px solid var(--k2-rule)',
      borderLeft: `3px solid ${tone}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
        <Avatar name={a.author.avatar} color={a.author.color} size={26}/>
        <span style={{ font:'600 13px var(--k2-sans)' }}>{a.author.name}</span>
        <span style={{ font:'400 11px var(--k2-mono)', color:'var(--k2-ink-3)' }}>· {a.author.rank} {a.author.rankIcon}</span>
        <span style={{ marginLeft:'auto', font:'400 11px var(--k2-mono)', color:'var(--k2-ink-3)' }}>{a.time}</span>
        {a.gilded && <span title="Ödüllü">🏅</span>}
      </div>
      <p className="k2-display" style={{
        margin:'0 0 12px', font:`500 ${compact?15:16}px/1.5 var(--k2-display)`,
        color:'var(--k2-ink)', textWrap:'pretty',
      }}>"{a.body}"</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 4 }}>
          <button onClick={()=>setVote(vote==='up'?null:'up')} style={{
            display:'inline-flex', alignItems:'center', gap: 5,
            padding:'5px 10px', borderRadius: 99, border:'1px solid var(--k2-rule)',
            background: vote==='up' ? tone+'14' : '#fff', color: vote==='up' ? tone : 'var(--k2-ink-2)',
            font:'600 12px var(--k2-mono)', cursor:'pointer',
          }} className="k2-tab">
            <Icons.arrowUp size={13}/> {(a.votes.score + (vote==='up'?1:0)).toLocaleString('tr-TR')}
          </button>
          <button onClick={()=>setVote(vote==='down'?null:'down')} style={{
            background:'none', border:'none', padding: 5,
            color: vote==='down' ? 'var(--k2-ink)' : 'var(--k2-ink-3)', cursor:'pointer',
          }}><Icons.arrowDown size={14}/></button>
        </div>
        <div style={{ display:'flex', gap: 2 }}>
          <button style={{ background:'none', border:'none', padding: 6, color:'var(--k2-ink-3)', cursor:'pointer',
                            font:'500 12px var(--k2-sans)' }}>
            <Icons.reply size={13}/> {a.replies}
          </button>
          <button style={{ background:'none', border:'none', padding: 6, color: tone, cursor:'pointer',
                            font:'500 12px var(--k2-sans)' }}>
            <Icons.swords size={13}/> Düello
          </button>
        </div>
      </div>
    </article>
  );
};

const ArenaColumn = ({ side, answers, vp, count }) => {
  const tone = sideColor(side);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 10, minWidth: 0 }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', borderRadius: 12,
        background: side==='sicak' ? 'var(--k2-warm-50)' : 'var(--k2-cool-50)',
        border:`1px solid ${side==='sicak' ? 'var(--k2-warm-100)' : 'var(--k2-cool-100)'}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: tone, color:'#fff',
                          display:'inline-flex', alignItems:'center', justifyContent:'center',
                          font:'700 13px var(--k2-sans)' }}>
            {side === 'sicak' ? '🔥' : '❄️'}
          </span>
          <div>
            <div className="k2-eyebrow" style={{ color: tone }}>{sideLabel(side)} TARAFI</div>
            <div style={{ font:'700 16px var(--k2-sans)', color:'var(--k2-ink)', marginTop: 2 }}>
              <span className="k2-tab">{count}</span> savunucu
            </div>
          </div>
        </div>
        <button className="k2-btn" style={{
          height: 32, padding:'0 14px', fontSize: 12.5,
          background: tone, color:'#fff',
        }}>
          <Icons.plus size={14}/> Bu tarafta yaz
        </button>
      </div>
      {answers.map(a => <ArenaAnswer key={a.id} a={a} vp={vp}/>)}
    </div>
  );
};

const DetailScreenV2 = ({ vp, data, onBack, edition }) => {
  const s = data.todayScenario;
  const isMobile = vp === 'mobile';
  const [sideFilter, setSideFilter] = useS2('both'); // mobile-only toggle
  const warm = data.answers.filter(a => a.side === 'sicak');
  const cool = data.answers.filter(a => a.side === 'soguk');
  const visibleWarm = isMobile && sideFilter === 'soguk' ? [] : warm;
  const visibleCool = isMobile && sideFilter === 'sicak' ? [] : cool;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      {/* Headline card */}
      <section className="k2-card" style={{ padding: isMobile ? 18 : 26 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, paddingBottom: 12,
                       borderBottom:'1px solid var(--k2-ink)', flexWrap:'wrap' }}>
          <span className="k2-eyebrow" style={{ color:'var(--k2-ink)' }}>Sayı № {edition}</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <span className="k2-eyebrow">11 Mayıs 2026</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
          <ModeChip mode="senaryo"/>
          <span style={{ marginLeft:'auto', font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }}>
            <Icons.clock size={12} style={{verticalAlign:'-1px'}}/> {s.countdown}
          </span>
        </div>
        <h1 className="k2-display" style={{
          margin:'18px 0 16px', fontSize: isMobile?28:40, lineHeight: 1.1, color:'var(--k2-ink)', textWrap:'balance',
        }}>{s.title}</h1>
        <TugBar warm={s.voteSplit.sicak} cool={s.voteSplit.soguk} big={!isMobile}/>

        {/* Your answer panel */}
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 12, background:'var(--k2-paper-2)',
          display:'flex', flexDirection: isMobile ? 'column':'row', gap: 12, alignItems: isMobile?'stretch':'center',
        }}>
          <SideChip side={s.side} big/>
          <div style={{ flex: 1, minWidth:0 }}>
            <div className="k2-eyebrow" style={{ marginBottom: 4 }}>Cevabın</div>
            <div className="k2-display" style={{ font:'500 17px/1.3 var(--k2-display)' }}>"{s.yourAnswer}"</div>
          </div>
          <div style={{ display:'flex', gap: 6 }}>
            <button className="k2-btn k2-btn-paper" style={{ height: 34, padding:'0 12px', fontSize: 12.5 }}>Düzenle</button>
            <button className="k2-btn k2-btn-ink" style={{ height: 34, padding:'0 14px', fontSize: 12.5 }}>
              <Icons.swords size={13}/> Düello at
            </button>
          </div>
        </div>
      </section>

      {/* Arena header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
          <h2 className="k2-display" style={{ margin:0, font:'500 22px var(--k2-display)' }}>Arena</h2>
          <span style={{ font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }}>· {s.answersCount.toLocaleString('tr-TR')} cevap</span>
        </div>
        {isMobile ? (
          <div style={{ display:'flex', gap: 4, padding: 3, borderRadius: 99,
                         background:'var(--k2-paper-2)' }}>
            {[
              {id:'sicak',l:'🔥', c:'var(--k2-warm-500)'},
              {id:'both', l:'İkisi', c:'var(--k2-ink)'},
              {id:'soguk',l:'❄️', c:'var(--k2-cool-500)'},
            ].map(t=>(
              <button key={t.id} onClick={()=>setSideFilter(t.id)} style={{
                padding:'6px 12px', borderRadius: 99, border:'none',
                background: sideFilter===t.id ? '#fff' : 'transparent',
                color: sideFilter===t.id ? t.c : 'var(--k2-ink-3)',
                font:`600 12px var(--k2-sans)`, cursor:'pointer',
                boxShadow: sideFilter===t.id ? '0 1px 3px rgba(0,0,0,.06)' : 'none',
              }}>{t.l}</button>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', gap: 6 }}>
            {['Top','Yeni','Düello','Tartışmalı'].map((t,i)=>(
              <button key={t} style={{
                padding:'6px 12px', borderRadius: 8, border:'none',
                background: i===0 ? 'var(--k2-paper-2)' : 'transparent',
                color: i===0 ? 'var(--k2-ink)' : 'var(--k2-ink-3)',
                font:`${i===0?600:500} 12.5px var(--k2-sans)`, cursor:'pointer',
              }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Two-column arena */}
      <div style={{
        display:'grid', gap: isMobile ? 14 : 18,
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}>
        {(!isMobile || sideFilter !== 'soguk') && (
          <ArenaColumn side="sicak" answers={visibleWarm} vp={vp} count={94}/>
        )}
        {(!isMobile || sideFilter !== 'sicak') && (
          <ArenaColumn side="soguk" answers={visibleCool} vp={vp} count={153}/>
        )}
      </div>

      <button className="k2-btn k2-btn-paper" style={{ alignSelf:'center', height: 40, padding:'0 22px' }}>
        243 cevap daha gör <Icons.arrowDown size={14}/>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER v2 — magazine grid
// ─────────────────────────────────────────────────────────────────────────────
const DiscoverScreenV2 = ({ vp, data, onOpenScenario }) => {
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
      {/* Search */}
      <div style={{ position:'relative' }}>
        <Icons.search size={17} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--k2-ink-3)' }}/>
        <input placeholder="Senaryo, düello, kullanıcı ara…" style={{
          width:'100%', height: 48, paddingLeft: 44, paddingRight: 16,
          font:'400 14.5px var(--k2-sans)',
          border:'1px solid var(--k2-rule)', borderRadius: 999,
          background:'#fff', color:'var(--k2-ink)', outline:'none',
        }}/>
      </div>

      {/* Featured editorial pick */}
      <article className="k2-card" style={{
        padding: 0, overflow:'hidden', display:'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--k2-warm-500), var(--k2-warm-700))',
          color:'#fff', padding: isMobile ? 22 : 32, position:'relative',
          minHeight: isMobile ? 200 : 280,
        }}>
          <div className="k2-eyebrow" style={{ color:'rgba(255,255,255,0.8)' }}>Haftanın senaryosu · Editör seçimi</div>
          <h3 className="k2-display" style={{
            margin:'14px 0 16px', font:'500 28px/1.15 var(--k2-display)', textWrap:'balance',
          }}>Sevgilinin eski fotoğraflarını gizlice gördüğünde ne hissediyorsun?</h3>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <Avatar name="C" color="#fff" size={24}/>
            <span style={{ font:'600 12.5px var(--k2-sans)', color:'#fff' }}>Cesur</span>
            <span style={{ font:'400 11px var(--k2-mono)', color:'rgba(255,255,255,.7)' }}>· 6s</span>
          </div>
          <div aria-hidden style={{
            position:'absolute', right: -40, bottom: -40, fontSize: 180, opacity: 0.08,
            fontFamily:'var(--k2-display)', fontStyle:'italic', fontWeight: 500, lineHeight: 1, color:'#fff',
          }}>"</div>
        </div>
        <div style={{ padding: isMobile?20:26, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', gap: 8, marginBottom: 14, alignItems:'center' }}>
              <ModeChip mode="emoji"/>
              <span style={{ font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }}>· #aile · #etik</span>
            </div>
            <p className="k2-display" style={{
              margin:0, font:`500 ${isMobile?16:18}px/1.55 var(--k2-display)`,
              color:'var(--k2-ink-2)', textWrap:'pretty',
            }}>"En çok oylanan cevap üç emoji ile geldi — ve hiç tartışılmadı. Topluluk bazen kelimelere değil, hisse oy veriyor."</p>
          </div>
          <div style={{ marginTop: 18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap: 14, font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }} className="k2-tab">
              <span><Icons.arrowUp size={12} style={{verticalAlign:'-1px', color:'var(--k-success)'}}/> 220</span>
              <span><Icons.msg size={12} style={{verticalAlign:'-1px'}}/> 188</span>
              <span><Icons.flame size={12} style={{verticalAlign:'-1px', color:'var(--k2-warm-500)'}}/> 56</span>
            </div>
            <button className="k2-btn k2-btn-paper" style={{ height: 34, padding:'0 14px', fontSize: 12.5 }}>
              Oku <Icons.arrowRight size={14}/>
            </button>
          </div>
        </div>
      </article>

      {/* Categories — editorial tiles */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
          <h3 className="k2-display" style={{ margin:0, font:'500 22px var(--k2-display)' }}>Bölümler</h3>
          <span className="k2-eyebrow">8 kategori</span>
        </div>
        <div style={{
          display:'grid', gap: 8,
          gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
        }}>
          {data.discoverCats.map(c => (
            <button key={c.id} style={{
              padding: 14, display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 6,
              background:'#fff', cursor:'pointer', textAlign:'left',
              borderRadius: 12, border:'1px solid var(--k2-rule)',
              transition:'border-color .12s, transform .08s',
            }}>
              <span style={{
                fontSize: 22, lineHeight: 1,
              }}>{c.emoji}</span>
              <span style={{ font:'600 14px var(--k2-sans)' }}>{c.label}</span>
              <span style={{ font:'500 11.5px var(--k2-mono)', color:'var(--k2-ink-3)' }} className="k2-tab">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
          <h3 className="k2-display" style={{ margin:0, font:'500 22px var(--k2-display)' }}>Yükselenler</h3>
          <span className="k2-eyebrow" style={{ color:'var(--k2-warm-600)' }}>Son 24 saat</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {data.feed.slice(0, 3).map(it => (
            <FeedCardV2 key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD v2 — podium with medals + table
// ─────────────────────────────────────────────────────────────────────────────
const LeaderboardScreenV2 = ({ vp, data }) => {
  const isMobile = vp === 'mobile';
  const [scope, setScope] = useS2('week');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
      {/* Hero */}
      <section className="k2-card" style={{ padding: isMobile?20:28, background:'var(--k2-ink)', color:'#fff', borderColor:'transparent' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap: 12 }}>
          <div>
            <div className="k2-eyebrow" style={{ color: 'var(--k2-warm-200)' }}>Bu hafta · 12 — 18 Mayıs</div>
            <h1 className="k2-display" style={{
              margin:'8px 0 0', font:`500 ${isMobile?28:40}px var(--k2-display)`, letterSpacing:'-0.02em',
            }}>Şampiyonlar tablosu</h1>
          </div>
          <div style={{ display:'flex', gap: 4, padding: 4, borderRadius: 99, background:'rgba(255,255,255,0.08)' }}>
            {[{id:'day',l:'Gün'},{id:'week',l:'Hafta'},{id:'month',l:'Ay'},{id:'all',l:'Tüm'}].map(s=>(
              <button key={s.id} onClick={()=>setScope(s.id)} style={{
                padding:'6px 14px', borderRadius: 99, border:'none',
                background: scope===s.id ? '#fff' : 'transparent',
                color: scope===s.id ? 'var(--k2-ink)' : 'rgba(255,255,255,.7)',
                font:`${scope===s.id?600:500} 12.5px var(--k2-sans)`, cursor:'pointer',
              }}>{s.l}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Podium */}
      {!isMobile && (
        <section style={{
          display:'grid', gridTemplateColumns:'1fr 1.1fr 1fr', alignItems:'end', gap: 14,
          padding:'12px 0 0',
        }}>
          {[1,0,2].map(idx => {
            const u = data.leaderboard[idx];
            const place = idx + 1;
            const heights = { 1: 180, 2: 140, 3: 110 };
            const medals  = { 1: '🥇', 2: '🥈', 3: '🥉' };
            const tones   = {
              1: 'linear-gradient(180deg, #fde68a, #d97706)',
              2: 'linear-gradient(180deg, #e5e7eb, #9ca3af)',
              3: 'linear-gradient(180deg, #fed7aa, #b45309)',
            };
            return (
              <div key={u.handle} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 10 }}>
                <div style={{ position:'relative' }}>
                  <Avatar name={u.avatar} color={u.color} size={place===1?72:56} ring="#fff"/>
                  <span style={{
                    position:'absolute', bottom:-6, right:-6, fontSize: place===1?28:22,
                    filter:'drop-shadow(0 2px 4px rgba(0,0,0,.15))',
                  }}>{medals[place]}</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div className="k2-display" style={{ font:`500 ${place===1?20:17}px var(--k2-display)` }}>{u.name}</div>
                  <div className="k2-tab" style={{ font:'500 13px var(--k2-mono)', color:'var(--k2-ink-3)' }}>
                    {u.points.toLocaleString('tr-TR')} puan
                  </div>
                </div>
                <div style={{
                  width: '100%', height: heights[place], borderRadius: '14px 14px 0 0',
                  background: tones[place],
                  display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: 12,
                  font:'700 36px var(--k2-display)', color:'#fff', letterSpacing:'-0.02em',
                  boxShadow:'inset 0 -10px 30px rgba(0,0,0,0.1)',
                }}>{place}</div>
              </div>
            );
          })}
        </section>
      )}

      {/* Table */}
      <section className="k2-card" style={{ overflow:'hidden' }}>
        <div style={{
          display:'grid', gridTemplateColumns: isMobile ? '40px 1fr 90px' : '50px 1fr 100px 100px 80px',
          padding:'10px 16px', borderBottom:'1px solid var(--k2-rule)', background:'var(--k2-paper-2)',
        }}>
          <span className="k2-eyebrow">№</span>
          <span className="k2-eyebrow">Oyuncu</span>
          {!isMobile && <span className="k2-eyebrow" style={{ textAlign:'right' }}>Düello</span>}
          {!isMobile && <span className="k2-eyebrow" style={{ textAlign:'right' }}>Galip</span>}
          <span className="k2-eyebrow" style={{ textAlign:'right' }}>Puan</span>
        </div>
        {data.leaderboard.map((u, i) => (
          <div key={u.handle} style={{
            display:'grid', gridTemplateColumns: isMobile ? '40px 1fr 90px' : '50px 1fr 100px 100px 80px',
            padding:'14px 16px', alignItems:'center', gap: 8,
            borderBottom: i === data.leaderboard.length-1 ? 'none' : '1px solid var(--k2-rule-soft)',
            background: u.handle === 'cesurr' ? 'var(--k2-warm-50)' : 'transparent',
          }}>
            <span className="k2-tab" style={{
              font:`700 ${u.rank<=3?17:14}px var(--k2-display)`,
              color: u.rank===1?'#d97706':u.rank===2?'#6b7280':u.rank===3?'#b45309':'var(--k2-ink-3)',
            }}>{u.rank}</span>
            <div style={{ display:'flex', alignItems:'center', gap: 10, minWidth: 0 }}>
              <Avatar name={u.avatar} color={u.color} size={34} badge={u.rank<=3 ? u.badge : null}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ font:'600 14px var(--k2-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {u.name}
                  {u.handle === 'cesurr' && <span style={{
                    marginLeft: 6, font:'600 10px var(--k2-sans)', color: 'var(--k2-warm-600)',
                    padding:'2px 7px', background:'var(--k2-warm-100)', borderRadius: 99,
                  }}>SEN</span>}
                </div>
                <div style={{ font:'400 11.5px var(--k2-mono)', color:'var(--k2-ink-3)' }}>@{u.handle}</div>
              </div>
            </div>
            {!isMobile && (
              <span className="k2-tab" style={{ textAlign:'right', font:'500 13px var(--k2-mono)', color:'var(--k2-ink-2)' }}>
                {[42, 38, 36, 28, 22, 18][i]}
              </span>
            )}
            {!isMobile && (
              <span className="k2-tab" style={{ textAlign:'right', font:'600 13px var(--k2-mono)', color:'var(--k-success)' }}>
                {[36, 30, 28, 20, 16, 11][i]}
              </span>
            )}
            <div style={{ textAlign:'right' }}>
              <div className="k2-tab" style={{ font:'700 14px var(--k2-display)', color:'var(--k2-ink)' }}>
                {u.points.toLocaleString('tr-TR')}
              </div>
              <div className="k2-tab" style={{
                font:'500 11px var(--k2-mono)',
                color: u.delta.startsWith('+') ? 'var(--k-success)' : u.delta.startsWith('-') ? 'var(--k2-warm-600)' : 'var(--k2-ink-3)',
              }}>{u.delta}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE v2 — letterhead
// ─────────────────────────────────────────────────────────────────────────────
const ProfileScreenV2 = ({ vp, data }) => {
  const u = data.user;
  const isMobile = vp === 'mobile';
  const [tab, setTab] = useS2('cevaplar');
  const tabs = ['Vitrin','Cevaplar','Düellolar','Senaryolar','Başarımlar'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      {/* Letterhead */}
      <section className="k2-card" style={{ padding: isMobile?20:28, position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                       paddingBottom: 14, borderBottom:'1px solid var(--k2-ink)' }}>
          <span className="k2-eyebrow" style={{ color:'var(--k2-ink)' }}>@{u.handle}</span>
          <span className="k2-eyebrow">Kapisio · sicil № 100 482</span>
        </div>
        <div style={{
          display:'flex', gap: isMobile?14:22, marginTop: 18,
          flexDirection: isMobile?'column':'row', alignItems: isMobile?'stretch':'flex-end',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 14, flex: 1, minWidth: 0 }}>
            <Avatar name={u.avatar} color={u.avatarColor} size={isMobile?72:96} ring="#fff"/>
            <div style={{ minWidth: 0 }}>
              <h1 className="k2-display" style={{
                margin:0, font:`500 ${isMobile?28:40}px var(--k2-display)`,
                letterSpacing:'-0.02em', lineHeight: 1.05, textWrap:'balance',
              }}>{u.name}</h1>
              <div style={{ marginTop: 6, font:'500 13px var(--k2-mono)', color:'var(--k2-ink-3)',
                              display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                <span>{u.rank} {u.rankIcon}</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
                <span>İstanbul</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k2-ink-3)' }}/>
                <span>2024'ten beri</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap: 8, flexShrink: 0 }}>
            <button className="k2-btn k2-btn-paper" style={{ flex: isMobile?1:'unset' }}>Düzenle</button>
            <button className="k2-btn k2-btn-ink" style={{ flex: isMobile?1:'unset' }}>
              <Icons.swords size={14}/> Düello at
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4}, 1fr)`, gap: isMobile?12:0,
          marginTop: 22, paddingTop: 18, borderTop:'1px solid var(--k2-rule)',
        }}>
          {[
            { l:'Puan',     v: u.points.toLocaleString('tr-TR'), c:'var(--k2-ink)' },
            { l:'Düello',   v: '24', c:'var(--k2-ink)' },
            { l:'Galibiyet',v: '14', c:'var(--k-success)' },
            { l:'Seri',     v: u.streak + ' gün', c:'var(--k2-warm-500)', icon:'🔥' },
          ].map((s,i) => (
            <div key={s.l} style={{
              padding: isMobile ? 0 : '0 18px',
              borderRight: !isMobile && i < 3 ? '1px solid var(--k2-rule)' : 'none',
              textAlign: isMobile ? 'left' : 'left',
            }}>
              <div className="k2-eyebrow">{s.l}</div>
              <div className="k2-display k2-tab" style={{
                marginTop: 4, font:`500 ${isMobile?22:30}px var(--k2-display)`, color: s.c,
              }}>{s.icon && <span style={{ fontSize:'.8em', marginRight: 4 }}>{s.icon}</span>}{s.v}</div>
            </div>
          ))}
        </div>

        {/* Rank progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 6 }}>
            <span className="k2-eyebrow">{u.rank} {u.rankIcon} → {u.nextRank}</span>
            <span className="k2-tab" style={{ font:'500 12px var(--k2-mono)', color:'var(--k2-ink-3)' }}>
              {u.points} / {u.nextRankAt}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background:'var(--k2-paper-3)', overflow:'hidden' }}>
            <div style={{
              width: (u.points/u.nextRankAt*100) + '%', height:'100%',
              background:'linear-gradient(90deg, var(--k2-warm-400), var(--k2-warm-500))',
            }}/>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 0, borderBottom:'1px solid var(--k2-rule)', overflowX:'auto' }}>
        {tabs.map(t => {
          const id = t.toLowerCase();
          const active = tab === id;
          return (
            <button key={t} onClick={()=>setTab(id)} style={{
              padding:'12px 16px', background:'transparent', border:'none',
              borderBottom: '2px solid ' + (active ? 'var(--k2-ink)' : 'transparent'),
              color: active ? 'var(--k2-ink)' : 'var(--k2-ink-3)',
              font: `${active?600:500} 13.5px var(--k2-sans)`, cursor:'pointer',
              whiteSpace:'nowrap', marginBottom: -1,
            }}>{t}</button>
          );
        })}
      </div>

      {/* Answer cards */}
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {data.answers.slice(0, 3).map(a => (
          <article key={a.id} className="k2-card" style={{
            padding: 18, borderLeft: `3px solid ${sideColor(a.side)}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
              <SideChip side={a.side}/>
              <ModeChip mode="senaryo"/>
              <span style={{ font:'400 11px var(--k2-mono)', color:'var(--k2-ink-3)' }}>· {a.time}</span>
              <span style={{ marginLeft:'auto', font:'500 12px var(--k2-mono)', color:'var(--k-success)' }} className="k2-tab">
                <Icons.arrowUp size={12} style={{verticalAlign:'-1px'}}/> {a.votes.score.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="k2-eyebrow" style={{ marginBottom: 6 }}>Pazar günü aile ziyaretinde…</div>
            <p className="k2-display" style={{
              margin:0, font:'500 17px/1.5 var(--k2-display)', color:'var(--k2-ink)', textWrap:'pretty',
            }}>"{a.body}"</p>
          </article>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  HomeScreenV2, DetailScreenV2, DiscoverScreenV2, LeaderboardScreenV2, ProfileScreenV2,
  SideChip, sideColor, TugBar,
});
