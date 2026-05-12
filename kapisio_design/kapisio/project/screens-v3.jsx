// Kapisio v3 — sharper than v1, same DNA (Geist + blue), real Sıcak/Soğuk semantics

const { useState: useS3 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Side helpers — Sıcak (warm) vs Soğuk (cool)
// ─────────────────────────────────────────────────────────────────────────────
const s3SideColor = (side) => side === 'sicak' ? 'var(--k3-warm-500)' : 'var(--k3-cool-500)';
const s3SideTone  = (side) => side === 'sicak' ? 'k3-side-warm'        : 'k3-side-cool';
const s3SideLabel = (side) => side === 'sicak' ? 'Sıcak'               : 'Soğuk';
const s3SideIcon  = (side) => side === 'sicak' ? '🔥'                   : '❄️';

const SideChipV3 = ({ side, big }) => (
  <span className={`k3-pill ${s3SideTone(side)}`} style={{
    padding: big ? '5px 12px' : '2px 9px',
    height: big ? 26 : 22,
    fontSize: big ? 12 : 11,
  }}>
    <span style={{ width: big?7:6, height: big?7:6, borderRadius:'50%', background: s3SideColor(side) }}/>
    {s3SideLabel(side)}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// TUG BAR — warm vs cool tug-of-war with center rope marker
// ─────────────────────────────────────────────────────────────────────────────
const TugBarV3 = ({ warm, cool, compact }) => (
  <div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: compact?6:9 }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap: 6,
                     font: `700 ${compact?12:14}px var(--k-font-sans)`, color:'var(--k3-warm-600)' }}>
        🔥 Sıcak <span className="k3-tab" style={{ fontFamily:'var(--k-font-mono)', fontWeight: 500, fontSize: compact?11:12 }}>{warm}%</span>
      </span>
      <span style={{ display:'inline-flex', alignItems:'center', gap: 6,
                     font: `700 ${compact?12:14}px var(--k-font-sans)`, color:'var(--k3-cool-700)' }}>
        <span className="k3-tab" style={{ fontFamily:'var(--k-font-mono)', fontWeight: 500, fontSize: compact?11:12 }}>{cool}%</span> Soğuk ❄️
      </span>
    </div>
    <div style={{
      position:'relative', height: compact?10:14, borderRadius: 99, overflow:'hidden',
      background: 'var(--k3-surface-2)',
    }}>
      <div style={{ position:'absolute', inset: 0, display:'flex' }}>
        <div style={{ width: warm+'%', background:'linear-gradient(90deg, var(--k3-warm-400), var(--k3-warm-500))' }}/>
        <div style={{ flex:1, background:'linear-gradient(90deg, var(--k-blue-500), var(--k-blue-400))' }}/>
      </div>
      <div style={{
        position:'absolute', top: -3, bottom: -3, left: warm+'%',
        width: 4, background:'var(--k3-ink)', transform:'translateX(-2px)',
        borderRadius: 4, boxShadow:'0 0 0 2px #fff',
      }}/>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HERO — Today's scenario as an "arena card"
// ─────────────────────────────────────────────────────────────────────────────
const ArenaHeroV3 = ({ vp, scenario, onOpen }) => {
  const isMobile = vp === 'mobile';
  return (
    <section style={{
      position:'relative', overflow:'hidden', borderRadius: 22,
      background:'linear-gradient(160deg, #0a1f55 0%, #1442a8 38%, #2a6cf0 100%)',
      boxShadow:'var(--k3-shadow-hero)',
      color:'#fff', padding: isMobile ? 20 : 28,
    }}>
      {/* Decorative number watermark */}
      <div aria-hidden style={{
        position:'absolute', right: -30, top: -50, font:'900 320px/1 var(--k-font-sans)',
        color:'rgba(255,255,255,0.04)', letterSpacing:'-0.05em', userSelect:'none',
      }}>?</div>

      {/* Top status row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                     gap: 10, flexWrap:'wrap', position:'relative' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap: 8 }}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap: 7,
            padding:'5px 12px', borderRadius: 99,
            background:'rgba(255,255,255,0.15)', backdropFilter:'blur(4px)',
            font:'700 11px var(--k-font-sans)', letterSpacing:'0.08em', textTransform:'uppercase',
          }}>
            <span className="k3-live-dot" style={{ background:'#bff5d5' }}/>
            Günün Senaryosu
          </span>
          <span className="k3-tab" style={{ font:'500 12px var(--k-font-mono)', opacity:.7 }}>
            {scenario.date} · 11.05.2026
          </span>
        </div>
        <span className="k3-tab" style={{
          display:'inline-flex', alignItems:'center', gap: 6,
          font:'600 12px var(--k-font-mono)', opacity:.95,
        }}>
          <Icons.clock size={13}/> Yenilenmeye {scenario.countdown}
        </span>
      </div>

      {/* Headline */}
      <h2 className="k3-h-1" style={{
        margin: isMobile ? '16px 0 18px' : '22px 0 22px',
        fontSize: isMobile ? 26 : 36,
        color:'#fff', textWrap:'balance', position:'relative',
      }}>
        {scenario.title}
      </h2>

      {/* Tug bar — on hero, dark variant */}
      <div style={{ position:'relative', marginBottom: 18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 8 }}>
          <span style={{ font:'700 13px var(--k-font-sans)', color:'#ffd4b3' }}>
            🔥 Sıcak <span className="k3-tab" style={{ fontFamily:'var(--k-font-mono)', fontWeight: 500, fontSize: 12, opacity:.85 }}>{scenario.voteSplit.sicak}%</span>
          </span>
          <span style={{ font:'700 13px var(--k-font-sans)', color:'#cbe2ff' }}>
            <span className="k3-tab" style={{ fontFamily:'var(--k-font-mono)', fontWeight: 500, fontSize: 12, opacity:.85 }}>{scenario.voteSplit.soguk}%</span> Soğuk ❄️
          </span>
        </div>
        <div style={{ position:'relative', height: 12, borderRadius: 99,
                       background:'rgba(255,255,255,0.12)', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset: 0, display:'flex' }}>
            <div style={{ width: scenario.voteSplit.sicak+'%',
                           background:'linear-gradient(90deg, #f58a3c, #ed6f1c)' }}/>
            <div style={{ flex:1, background:'linear-gradient(90deg, #4aa8ff, #88aeff)' }}/>
          </div>
          <div style={{
            position:'absolute', top: -3, bottom: -3, left: scenario.voteSplit.sicak+'%',
            width: 4, background:'#fff', transform:'translateX(-2px)',
            borderRadius: 4, boxShadow:'0 0 12px rgba(255,255,255,0.7)',
          }}/>
        </div>
      </div>

      {/* Status panel — answered or write CTA */}
      {scenario.answered ? (
        <div style={{
          display:'flex', flexDirection: isMobile?'column':'row',
          alignItems: isMobile?'stretch':'center', gap: 12,
          padding: isMobile ? 14 : '14px 18px', borderRadius: 14,
          background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{ flex: 1, minWidth: 0, display:'flex', gap: 12, alignItems:'center' }}>
            <SideChipV3 side={scenario.side} big/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font:'600 11px var(--k-font-sans)', letterSpacing:'0.08em',
                              textTransform:'uppercase', opacity:.75, marginBottom: 3 }}>Cevabın</div>
              <div style={{
                font:'600 16px var(--k-font-sans)', color:'#fff',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isMobile?'normal':'nowrap',
              }}>"{scenario.yourAnswer}"</div>
            </div>
          </div>
          <div style={{ display:'flex', gap: 8, flexShrink: 0 }}>
            <button className="k3-btn" onClick={onOpen} style={{
              background:'#fff', color:'var(--k-blue-700)', flex: isMobile?1:'unset',
            }}>
              <Icons.swords size={16}/> Düello
            </button>
            <button className="k3-btn" onClick={onOpen} style={{
              background:'rgba(255,255,255,0.16)', color:'#fff', flex: isMobile?1:'unset',
            }}>
              <span className="k3-tab">{scenario.answersCount}</span> cevap
            </button>
          </div>
        </div>
      ) : (
        <button onClick={onOpen} className="k3-btn" style={{
          background:'#fff', color:'var(--k-blue-700)', height: 48, fontSize: 15, padding:'0 24px',
        }}>
          <Icons.bolt size={18}/> Tarafını seç, cevabını yaz
        </button>
      )}

      {/* Live participation strip */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginTop: 16, font:'500 12px var(--k-font-sans)', opacity:.85, flexWrap:'wrap', gap: 12,
      }}>
        <div className="k3-tab" style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <span><strong>{scenario.answersCount.toLocaleString('tr-TR')}</strong> cevap</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'currentColor', opacity:.4 }}/>
          <span><strong style={{ color:'#ffd4b3' }}>{scenario.duellosLive}</strong> aktif düello</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'currentColor', opacity:.4 }}/>
          <span><strong>1.4k</strong> oy</span>
        </div>
        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{ display:'flex' }}>
              {['#ed6f1c','#2a6cf0','#1442a8','#4aa8ff'].map((c,i)=>(
                <span key={i} style={{
                  width: 24, height: 24, borderRadius:'50%', background: c,
                  border:'2px solid #1442a8', marginLeft: i?-7:0,
                  font:'700 9px var(--k-font-sans)', color:'#fff',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                }}>{['EH','MY','ZA','LK'][i]}</span>
              ))}
            </div>
            <span style={{ fontSize: 12 }}>+243 katıldı</span>
          </div>
        )}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARD v3 — sharper than v1
// ─────────────────────────────────────────────────────────────────────────────
const FeedCardV3 = ({ item, vp, onOpen }) => {
  const [vote, setVote] = useS3(null);
  const isMobile = vp === 'mobile';
  const isDuel = item.kind === 'duel';
  return (
    <article className="k3-card" style={{
      padding: isMobile ? 16 : 18, cursor:'pointer',
      transition:'border-color .12s, transform .08s, box-shadow .12s',
    }} onClick={() => onOpen?.(item)}>
      {/* Meta */}
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 10 }}>
        <ModeChip mode={item.mode}/>
        <div style={{ display:'flex', alignItems:'center', gap: 7, minWidth: 0, flex: 1 }}>
          {isDuel ? (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <span style={{ font:'600 13px var(--k-font-sans)' }}>{item.author.name}</span>
              <span style={{ font:'700 11px var(--k-font-sans)', color:'var(--k3-ink-3)',
                              padding:'2px 7px', background:'var(--k3-surface-2)', borderRadius: 4 }}>VS</span>
              <Avatar name={item.vs.avatar} color={item.vs.color} size={22}/>
              <span style={{ font:'600 13px var(--k-font-sans)',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth: 0 }}>{item.vs.name}</span>
            </>
          ) : (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <span style={{ font:'600 13px var(--k-font-sans)' }}>{item.author.name}</span>
              <span style={{ font:'400 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>· {item.time}</span>
            </>
          )}
        </div>
        <button onClick={(e)=>e.stopPropagation()} style={{
          background:'none', border:'none', color:'var(--k3-ink-3)', padding: 4, cursor:'pointer',
        }}><Icons.more size={16}/></button>
      </div>

      {/* Headline — Geist 700, tight tracking */}
      <h3 className="k3-h-2" style={{
        margin:'0 0 10px', fontSize: isMobile?18:19, color:'var(--k3-ink)', textWrap:'pretty',
      }}>{item.title}</h3>

      {item.preview && (
        <p style={{
          margin:'0 0 14px', font:'400 14px/1.55 var(--k-font-sans)', color:'var(--k3-ink-2)',
          display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden',
        }}>{item.preview}</p>
      )}

      {isDuel && (
        <div style={{ margin:'0 0 12px' }}>
          <TugBarV3 warm={46} cool={54} compact/>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          {!isDuel ? (
            <div style={{
              display:'flex', alignItems:'center', gap: 0,
              border:'1px solid var(--k3-rule)', borderRadius: 999, padding: 2,
            }}>
              <button onClick={(e)=>{e.stopPropagation(); setVote(vote==='up'?null:'up');}} style={{
                display:'inline-flex', alignItems:'center', gap: 5, padding:'4px 10px',
                borderRadius: 99, border:'none',
                background: vote==='up' ? 'var(--k-success-50)' : 'transparent',
                color: vote==='up' ? 'var(--k-success)' : 'var(--k3-ink-2)',
                font:'600 12px var(--k-font-mono)', cursor:'pointer',
              }} className="k3-tab">
                <Icons.arrowUp size={13}/>
                {(item.vote.up + (vote==='up'?1:0)).toLocaleString('tr-TR')}
              </button>
              <span style={{ width: 1, height: 16, background:'var(--k3-rule)' }}/>
              <button onClick={(e)=>{e.stopPropagation(); setVote(vote==='down'?null:'down');}} style={{
                padding:'4px 8px', border:'none', background:'transparent',
                color: vote==='down' ? 'var(--k3-warm-600)' : 'var(--k3-ink-3)', cursor:'pointer',
              }}>
                <Icons.arrowDown size={13}/>
              </button>
            </div>
          ) : (
            <button onClick={(e)=>e.stopPropagation()} className="k3-btn" style={{
              height: 28, padding:'0 12px', fontSize: 12,
              background:'var(--k3-warm-50)', color:'var(--k3-warm-700)',
              border:'1px solid var(--k3-warm-100)',
            }}>
              <Icons.target size={12}/> Oyla
            </button>
          )}
          <span className="k3-tab" style={{ font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
            <Icons.msg size={12} style={{ verticalAlign:'-1px', marginRight: 3 }}/>{item.stats.answers}
          </span>
          <span className="k3-tab" style={{ font:'500 12px var(--k-font-mono)', color:'var(--k3-warm-600)' }}>
            <Icons.flame size={12} style={{ verticalAlign:'-1px', marginRight: 3 }}/>{item.stats.fire}
          </span>
        </div>
        <div style={{ display:'flex', gap: 2 }}>
          <button onClick={(e)=>e.stopPropagation()} style={{
            background:'none', border:'none', color:'var(--k3-ink-3)', padding: 6, cursor:'pointer',
          }}><Icons.bookmark size={15}/></button>
          <button onClick={(e)=>e.stopPropagation()} style={{
            background:'none', border:'none', color:'var(--k3-ink-3)', padding: 6, cursor:'pointer',
          }}><Icons.share size={15}/></button>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME v3
// ─────────────────────────────────────────────────────────────────────────────
const HomeScreenV3 = ({ vp, data, onOpenScenario }) => {
  const isMobile = vp === 'mobile';
  const [filter, setFilter] = useS3('top');
  const filters = [
    { id:'top',    l:'En çok oylanan' },
    { id:'new',    l:'Yeni' },
    { id:'duels',  l:'Düellolar' },
    { id:'follow', l:'Takip' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: isMobile?14:18 }}>
      <ArenaHeroV3 vp={vp} scenario={data.todayScenario}
                   onOpen={() => onOpenScenario(data.todayScenario)}/>

      {/* Filter rail + sort */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', gap: 12,
        overflowX: isMobile?'auto':'visible', paddingBottom: 2,
      }}>
        <div style={{ display:'flex', gap: 6 }}>
          {filters.map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)} className="k3-pill" style={{
              padding:'7px 14px', height: 32,
              border:'1px solid ' + (filter===f.id ? 'var(--k3-ink)' : 'var(--k3-rule)'),
              background: filter===f.id ? 'var(--k3-ink)' : 'var(--k3-surface)',
              color: filter===f.id ? '#fff' : 'var(--k3-ink-2)',
              cursor:'pointer', whiteSpace:'nowrap',
            }}>{f.l}</button>
          ))}
        </div>
        {!isMobile && (
          <span className="k3-eyebrow" style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
            <span className="k3-live-dot"/> Canlı akış
          </span>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {data.feed.map(it => <FeedCardV3 key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>)}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL — Two-column arena, Geist only
// ─────────────────────────────────────────────────────────────────────────────
const ArenaAnswerV3 = ({ a }) => {
  const [vote, setVote] = useS3(null);
  const tone = s3SideColor(a.side);
  return (
    <article style={{
      padding: 14, borderRadius: 14,
      background: 'var(--k3-surface)', border: '1px solid var(--k3-rule)',
      borderLeft: `3px solid ${tone}`,
      transition:'transform .08s, border-color .12s',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
        <Avatar name={a.author.avatar} color={a.author.color} size={26}/>
        <span style={{ font:'600 13px var(--k-font-sans)' }}>{a.author.name}</span>
        <span style={{ font:'500 11px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
          · {a.author.rank} {a.author.rankIcon}
        </span>
        <span style={{ marginLeft:'auto', font:'500 11px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>{a.time}</span>
        {a.gilded && <span title="Ödüllü cevap">🏅</span>}
      </div>
      <p style={{
        margin:'0 0 12px', font:'500 15px/1.5 var(--k-font-sans)',
        color:'var(--k3-ink)', textWrap:'pretty', letterSpacing:'-0.005em',
      }}>{a.body}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          display:'flex', alignItems:'center', gap: 0,
          border:'1px solid var(--k3-rule)', borderRadius: 99, padding: 2,
        }}>
          <button onClick={()=>setVote(vote==='up'?null:'up')} style={{
            display:'inline-flex', alignItems:'center', gap: 5, padding:'4px 10px',
            borderRadius: 99, border:'none',
            background: vote==='up' ? tone+'18' : 'transparent',
            color: vote==='up' ? tone : 'var(--k3-ink-2)',
            font:'600 12.5px var(--k-font-mono)', cursor:'pointer',
          }} className="k3-tab">
            <Icons.arrowUp size={13}/>
            {(a.votes.score + (vote==='up'?1:0)).toLocaleString('tr-TR')}
          </button>
          <span style={{ width: 1, height: 16, background:'var(--k3-rule)' }}/>
          <button onClick={()=>setVote(vote==='down'?null:'down')} style={{
            padding:'4px 8px', border:'none', background:'transparent',
            color: vote==='down' ? 'var(--k3-ink)' : 'var(--k3-ink-3)', cursor:'pointer',
          }}>
            <Icons.arrowDown size={13}/>
          </button>
        </div>
        <div style={{ display:'flex', gap: 2 }}>
          <button style={{
            background:'none', border:'none', padding:'6px 10px',
            color:'var(--k3-ink-3)', cursor:'pointer',
            font:'500 12px var(--k-font-sans)',
          }}><Icons.reply size={13}/> {a.replies}</button>
          <button style={{
            background:'none', border:'none', padding:'6px 10px',
            color: tone, cursor:'pointer',
            font:'600 12px var(--k-font-sans)',
          }}><Icons.swords size={13}/> Düello</button>
        </div>
      </div>
    </article>
  );
};

const ArenaColumnV3 = ({ side, answers, count }) => {
  const tone = s3SideColor(side);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 10, minWidth: 0 }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8,
        padding:'10px 14px', borderRadius: 14,
        background: side==='sicak' ? 'var(--k3-warm-50)' : 'var(--k3-cool-50)',
        border:`1px solid ${side==='sicak' ? 'var(--k3-warm-100)' : 'var(--k3-cool-100)'}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 10, background: tone, color:'#fff',
            display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 16,
          }}>{s3SideIcon(side)}</span>
          <div>
            <div className="k3-eyebrow" style={{ color: tone }}>{s3SideLabel(side).toUpperCase()} TARAFI</div>
            <div style={{ font:'700 16px var(--k-font-sans)', color:'var(--k3-ink)', marginTop: 2 }}>
              <span className="k3-tab">{count}</span> savunucu
            </div>
          </div>
        </div>
        <button className="k3-btn" style={{
          height: 32, padding:'0 12px', fontSize: 12.5,
          background: tone, color:'#fff',
        }}>
          <Icons.plus size={14}/> Yaz
        </button>
      </div>
      {answers.map(a => <ArenaAnswerV3 key={a.id} a={a}/>)}
    </div>
  );
};

const DetailScreenV3 = ({ vp, data, onBack }) => {
  const s = data.todayScenario;
  const isMobile = vp === 'mobile';
  const [sideFilter, setSideFilter] = useS3('both');
  const warm = data.answers.filter(a => a.side === 'sicak');
  const cool = data.answers.filter(a => a.side === 'soguk');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      {/* Scenario card */}
      <section className="k3-card" style={{ padding: isMobile?18:26 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 14, flexWrap:'wrap' }}>
          <ModeChip mode="senaryo" size="lg"/>
          <span className="k3-eyebrow">Günün Senaryosu · {s.date}</span>
          <span className="k3-tab" style={{ marginLeft:'auto', font:'500 12px var(--k-font-mono)',
                                              color:'var(--k3-ink-3)', display:'inline-flex', gap: 4, alignItems:'center' }}>
            <Icons.clock size={13}/> {s.countdown}
          </span>
        </div>
        <h1 className="k3-h-1" style={{
          margin:'4px 0 18px', fontSize: isMobile?26:36, color:'var(--k3-ink)', textWrap:'balance',
        }}>{s.title}</h1>
        <TugBarV3 warm={s.voteSplit.sicak} cool={s.voteSplit.soguk}/>

        {/* Your answer */}
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 14,
          background:'var(--k3-surface-2)',
          display:'flex', flexDirection: isMobile?'column':'row',
          gap: 12, alignItems: isMobile?'stretch':'center',
        }}>
          <SideChipV3 side={s.side} big/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="k3-eyebrow" style={{ marginBottom: 4 }}>Cevabın</div>
            <div style={{ font:'600 16px var(--k-font-sans)', color:'var(--k3-ink)' }}>"{s.yourAnswer}"</div>
          </div>
          <div style={{ display:'flex', gap: 6 }}>
            <button className="k3-btn k3-btn-outline" style={{ height: 36, padding:'0 14px', fontSize: 13 }}>Düzenle</button>
            <button className="k3-btn k3-btn-primary" style={{ height: 36, padding:'0 14px', fontSize: 13 }}>
              <Icons.swords size={13}/> Düello at
            </button>
          </div>
        </div>
      </section>

      {/* Arena header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
          <h2 className="k3-h-2" style={{ margin: 0, fontSize: 22 }}>Arena</h2>
          <span className="k3-tab" style={{ font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
            · {s.answersCount.toLocaleString('tr-TR')} cevap
          </span>
        </div>
        {isMobile ? (
          <div style={{ display:'flex', gap: 3, padding: 3, borderRadius: 99,
                          background:'var(--k3-surface-2)' }}>
            {[
              {id:'sicak',l:'🔥', c:'var(--k3-warm-500)'},
              {id:'both', l:'Tümü', c:'var(--k3-ink)'},
              {id:'soguk',l:'❄️', c:'var(--k3-cool-500)'},
            ].map(t=>(
              <button key={t.id} onClick={()=>setSideFilter(t.id)} style={{
                padding:'6px 12px', borderRadius: 99, border:'none',
                background: sideFilter===t.id ? '#fff' : 'transparent',
                color: sideFilter===t.id ? t.c : 'var(--k3-ink-3)',
                font:'600 12px var(--k-font-sans)', cursor:'pointer',
                boxShadow: sideFilter===t.id ? '0 1px 3px rgba(10,15,30,.08)' : 'none',
              }}>{t.l}</button>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', gap: 4 }}>
            {['Top','Yeni','Düello','Tartışmalı'].map((t,i)=>(
              <button key={t} style={{
                padding:'7px 12px', borderRadius: 8, border:'none',
                background: i===0 ? 'var(--k3-surface-2)' : 'transparent',
                color: i===0 ? 'var(--k3-ink)' : 'var(--k3-ink-3)',
                font:`${i===0?600:500} 12.5px var(--k-font-sans)`, cursor:'pointer',
              }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Two-column arena */}
      <div style={{
        display:'grid', gap: isMobile?14:16,
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}>
        {(!isMobile || sideFilter !== 'soguk') && (
          <ArenaColumnV3 side="sicak" answers={warm} count={94}/>
        )}
        {(!isMobile || sideFilter !== 'sicak') && (
          <ArenaColumnV3 side="soguk" answers={cool} count={153}/>
        )}
      </div>

      <button className="k3-btn k3-btn-outline" style={{ alignSelf:'center', height: 42, padding:'0 22px' }}>
        243 cevap daha gör <Icons.arrowDown size={14}/>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD v3 — podium + dense table, Kapisio voice
// ─────────────────────────────────────────────────────────────────────────────
const LeaderboardScreenV3 = ({ vp, data }) => {
  const isMobile = vp === 'mobile';
  const [scope, setScope] = useS3('week');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
      {/* Hero */}
      <section style={{
        padding: isMobile?20:28, borderRadius: 22,
        background:'linear-gradient(140deg, #0a1f55 0%, #1442a8 50%, #2a6cf0 100%)',
        color:'#fff', boxShadow:'var(--k3-shadow-hero)', position:'relative', overflow:'hidden',
      }}>
        <div aria-hidden style={{
          position:'absolute', right: -40, top: -40, fontSize: 200,
          color:'rgba(255,255,255,0.06)', letterSpacing:'-0.05em', userSelect:'none', lineHeight: 1,
        }}>🏆</div>
        <div className="k3-eyebrow" style={{ color:'rgba(255,255,255,0.7)' }}>Bu hafta · 12 — 18 Mayıs</div>
        <h1 className="k3-h-1" style={{
          margin:'8px 0 16px', fontSize: isMobile?32:46, color:'#fff',
        }}>Liderlik</h1>
        <div style={{ display:'flex', gap: 4, padding: 4, borderRadius: 99,
                        background:'rgba(255,255,255,0.1)', width:'fit-content' }}>
          {[{id:'day',l:'Bugün'},{id:'week',l:'Hafta'},{id:'month',l:'Ay'},{id:'all',l:'Tüm Zaman'}].map(s=>(
            <button key={s.id} onClick={()=>setScope(s.id)} style={{
              padding:'7px 14px', borderRadius: 99, border:'none',
              background: scope===s.id ? '#fff' : 'transparent',
              color: scope===s.id ? 'var(--k-blue-700)' : 'rgba(255,255,255,.8)',
              font:`${scope===s.id?600:500} 12.5px var(--k-font-sans)`, cursor:'pointer',
            }}>{s.l}</button>
          ))}
        </div>
      </section>

      {/* Podium */}
      {!isMobile && (
        <section style={{
          display:'grid', gridTemplateColumns:'1fr 1.15fr 1fr', alignItems:'end', gap: 12,
        }}>
          {[1,0,2].map(idx => {
            const u = data.leaderboard[idx];
            const place = idx + 1;
            const heights = { 1: 170, 2: 130, 3: 100 };
            const medals  = { 1: '🥇', 2: '🥈', 3: '🥉' };
            const grad    = {
              1: 'linear-gradient(180deg, #fcd34d, #d97706)',
              2: 'linear-gradient(180deg, #e5e7eb, #94a3b8)',
              3: 'linear-gradient(180deg, #fdba74, #b45309)',
            };
            return (
              <div key={u.handle} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 10 }}>
                <div style={{ position:'relative' }}>
                  <Avatar name={u.avatar} color={u.color} size={place===1?78:60} ring="#fff"/>
                  <span style={{
                    position:'absolute', bottom:-4, right:-4, fontSize: place===1?30:24,
                    filter:'drop-shadow(0 2px 4px rgba(0,0,0,.15))',
                  }}>{medals[place]}</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ font:`700 ${place===1?17:15}px var(--k-font-sans)`, letterSpacing:'-0.01em' }}>{u.name}</div>
                  <div className="k3-tab" style={{ font:'500 12.5px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
                    {u.points.toLocaleString('tr-TR')} puan
                  </div>
                </div>
                <div style={{
                  width:'100%', height: heights[place], borderRadius: '14px 14px 0 0',
                  background: grad[place], position:'relative',
                  display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop: 12,
                  font:'900 36px var(--k-font-sans)', color:'#fff', letterSpacing:'-0.04em',
                  boxShadow:'inset 0 -20px 40px rgba(0,0,0,0.12)',
                  border:'1px solid rgba(0,0,0,0.05)',
                }}>{place}</div>
              </div>
            );
          })}
        </section>
      )}

      {/* Table */}
      <section className="k3-card" style={{ overflow:'hidden', padding: 0 }}>
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '40px 1fr 90px' : '50px 1fr 90px 90px 90px',
          padding:'12px 18px', borderBottom:'1px solid var(--k3-rule)', background:'var(--k3-surface-2)',
        }}>
          <span className="k3-eyebrow">№</span>
          <span className="k3-eyebrow">Oyuncu</span>
          {!isMobile && <span className="k3-eyebrow" style={{ textAlign:'right' }}>Düello</span>}
          {!isMobile && <span className="k3-eyebrow" style={{ textAlign:'right' }}>Galip</span>}
          <span className="k3-eyebrow" style={{ textAlign:'right' }}>Puan</span>
        </div>
        {data.leaderboard.map((u, i) => (
          <div key={u.handle} style={{
            display:'grid',
            gridTemplateColumns: isMobile ? '40px 1fr 90px' : '50px 1fr 90px 90px 90px',
            padding:'14px 18px', alignItems:'center', gap: 8,
            borderBottom: i === data.leaderboard.length-1 ? 'none' : '1px solid var(--k3-rule)',
            background: u.handle === 'cesurr' ? 'var(--k-blue-50)' : 'transparent',
          }}>
            <span className="k3-tab" style={{
              font:`${u.rank<=3?800:700} ${u.rank<=3?17:14}px var(--k-font-sans)`,
              color: u.rank===1?'#d97706':u.rank===2?'#6b7280':u.rank===3?'#b45309':'var(--k3-ink-3)',
              letterSpacing:'-0.02em',
            }}>{u.rank}</span>
            <div style={{ display:'flex', alignItems:'center', gap: 10, minWidth: 0 }}>
              <Avatar name={u.avatar} color={u.color} size={34} badge={u.rank<=3 ? u.badge : null}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ font:'600 14px var(--k-font-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {u.name}
                  {u.handle === 'cesurr' && (
                    <span className="k3-pill" style={{
                      marginLeft: 6, background:'var(--k-blue-500)', color:'#fff', height: 18, padding:'0 8px', fontSize: 10,
                    }}>SEN</span>
                  )}
                </div>
                <div style={{ font:'400 11.5px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>@{u.handle}</div>
              </div>
            </div>
            {!isMobile && (
              <span className="k3-tab" style={{ textAlign:'right', font:'500 13px var(--k-font-mono)', color:'var(--k3-ink-2)' }}>
                {[42, 38, 36, 28, 22, 18][i]}
              </span>
            )}
            {!isMobile && (
              <span className="k3-tab" style={{ textAlign:'right', font:'600 13px var(--k-font-mono)', color:'var(--k-success)' }}>
                {[36, 30, 28, 20, 16, 11][i]}
              </span>
            )}
            <div style={{ textAlign:'right' }}>
              <div className="k3-tab" style={{ font:'700 15px var(--k-font-sans)', color:'var(--k3-ink)', letterSpacing:'-0.01em' }}>
                {u.points.toLocaleString('tr-TR')}
              </div>
              <div className="k3-tab" style={{
                font:'600 11px var(--k-font-mono)',
                color: u.delta.startsWith('+') ? 'var(--k-success)' : u.delta.startsWith('-') ? 'var(--k3-warm-600)' : 'var(--k3-ink-3)',
              }}>{u.delta}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVER v3
// ─────────────────────────────────────────────────────────────────────────────
const DiscoverScreenV3 = ({ vp, data, onOpenScenario }) => {
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
      <div style={{ position:'relative' }}>
        <Icons.search size={17} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--k3-ink-3)' }}/>
        <input placeholder="Senaryo, düello, kullanıcı ara…" style={{
          width:'100%', height: 46, paddingLeft: 44, paddingRight: 16,
          font:'400 14.5px var(--k-font-sans)',
          border:'1px solid var(--k3-rule)', borderRadius: 14,
          background:'var(--k3-surface)', color:'var(--k3-ink)', outline:'none',
        }}/>
      </div>

      {/* Featured */}
      <article className="k3-card" style={{
        padding: 0, overflow:'hidden', display:'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr',
      }}>
        <div style={{
          background: 'linear-gradient(155deg, #ed6f1c 0%, #c8540e 60%, #93390a 100%)',
          color:'#fff', padding: isMobile?22:32, position:'relative', minHeight: isMobile?200:280,
          display:'flex', flexDirection:'column', justifyContent:'space-between',
        }}>
          <div className="k3-eyebrow" style={{ color:'rgba(255,255,255,0.85)' }}>Haftanın senaryosu · Editör seçimi</div>
          <h3 className="k3-h-2" style={{
            margin:'14px 0', fontSize: isMobile?22:28, color:'#fff', textWrap:'balance',
          }}>Sevgilinin eski fotoğraflarını gizlice gördüğünde ne hissediyorsun?</h3>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <Avatar name="C" color="rgba(255,255,255,0.3)" size={24}/>
            <span style={{ font:'600 12.5px var(--k-font-sans)' }}>Cesur</span>
            <span style={{ font:'400 11px var(--k-font-mono)', opacity:.7 }}>· 6s</span>
          </div>
        </div>
        <div style={{ padding: isMobile?20:26, display:'flex', flexDirection:'column', justifyContent:'space-between', gap: 16 }}>
          <div>
            <div style={{ display:'flex', gap: 8, marginBottom: 14, alignItems:'center' }}>
              <ModeChip mode="emoji"/>
              <span style={{ font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>#aile · #etik</span>
            </div>
            <p style={{
              margin: 0, font:'500 15px/1.55 var(--k-font-sans)', color:'var(--k3-ink-2)',
              textWrap:'pretty',
            }}>Topluluk üç emoji ile bir hisse oy verdi: <strong style={{ fontSize: 18 }}>😶‍🌫️ 🥲 🔥</strong>. Tartışma yok, ama 220 upvote.</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="k3-tab" style={{ display:'flex', gap: 14, font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
              <span><Icons.arrowUp size={12} style={{ verticalAlign:'-1px', color:'var(--k-success)' }}/> 220</span>
              <span><Icons.msg size={12} style={{ verticalAlign:'-1px' }}/> 188</span>
              <span><Icons.flame size={12} style={{ verticalAlign:'-1px', color:'var(--k3-warm-500)' }}/> 56</span>
            </div>
            <button className="k3-btn k3-btn-outline" style={{ height: 36, padding:'0 16px', fontSize: 13 }}>
              Oku <Icons.arrowRight size={13}/>
            </button>
          </div>
        </div>
      </article>

      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
          <h3 className="k3-h-2" style={{ margin:0, fontSize: 20 }}>Bölümler</h3>
          <span className="k3-eyebrow">8 kategori</span>
        </div>
        <div style={{
          display:'grid', gap: 10,
          gridTemplateColumns: `repeat(${isMobile?2:4}, 1fr)`,
        }}>
          {data.discoverCats.map(c => (
            <button key={c.id} className="k3-card" style={{
              padding: 14, display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 6,
              cursor:'pointer', textAlign:'left',
              transition:'border-color .12s, transform .08s',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 12,
                background: `color-mix(in oklab, ${c.color} 14%, white)`,
                color: c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize: 20,
              }}>{c.emoji}</span>
              <span style={{ font:'700 14px var(--k-font-sans)', letterSpacing:'-0.01em' }}>{c.label}</span>
              <span className="k3-tab" style={{ font:'500 11.5px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
          <h3 className="k3-h-2" style={{ margin:0, fontSize: 20 }}>Yükselenler</h3>
          <span className="k3-eyebrow" style={{ color:'var(--k3-warm-600)', display:'inline-flex', gap:6, alignItems:'center' }}>
            <Icons.flame size={11}/> Son 24 saat
          </span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {data.feed.slice(0, 3).map(it => (
            <FeedCardV3 key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE v3 — modern card stack, big stat numerals
// ─────────────────────────────────────────────────────────────────────────────
const ProfileScreenV3 = ({ vp, data }) => {
  const u = data.user;
  const isMobile = vp === 'mobile';
  const [tab, setTab] = useS3('cevaplar');
  const tabs = ['Vitrin','Cevaplar','Düellolar','Senaryolar','Başarımlar'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      {/* Header card */}
      <section className="k3-card" style={{ overflow:'hidden', padding: 0 }}>
        <div style={{
          height: isMobile?100:128,
          background:'linear-gradient(135deg, #0a1f55 0%, #1442a8 50%, #2a6cf0 100%)',
          position:'relative',
        }}>
          <div aria-hidden style={{ position:'absolute', inset: 0, background:
            'radial-gradient(at 25% 60%, rgba(237,111,28,0.25), transparent 40%), radial-gradient(at 80% 30%, rgba(255,255,255,0.12), transparent 50%)' }}/>
        </div>
        <div style={{ padding: isMobile?'0 18px 18px':'0 28px 24px' }}>
          <div style={{
            display:'flex', alignItems:'flex-end', gap: 16,
            marginTop: isMobile?-36:-48, flexWrap:'wrap',
          }}>
            <Avatar name={u.avatar} color={u.avatarColor} size={isMobile?72:100} ring="#fff"/>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 6 }}>
              <h1 className="k3-h-1" style={{
                margin:0, fontSize: isMobile?22:30, color:'var(--k3-ink)', textWrap:'balance',
              }}>{u.name}</h1>
              <div style={{ marginTop: 4, font:'500 13px var(--k-font-mono)', color:'var(--k3-ink-3)',
                              display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                <span>@{u.handle}</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k3-ink-3)' }}/>
                <span>{u.rank} {u.rankIcon}</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--k3-ink-3)' }}/>
                <span>İstanbul</span>
              </div>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap: 8, paddingBottom: 6 }}>
                <button className="k3-btn k3-btn-outline">Düzenle</button>
                <button className="k3-btn k3-btn-primary"><Icons.swords size={14}/> Düello at</button>
              </div>
            )}
          </div>
          {isMobile && (
            <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
              <button className="k3-btn k3-btn-outline" style={{ flex: 1 }}>Düzenle</button>
              <button className="k3-btn k3-btn-primary" style={{ flex: 1 }}><Icons.swords size={14}/> Düello at</button>
            </div>
          )}

          {/* Stats — large numerals */}
          <div style={{
            display:'grid', gridTemplateColumns:`repeat(${isMobile?2:4}, 1fr)`,
            gap: 0, marginTop: 20, paddingTop: 18, borderTop:'1px solid var(--k3-rule)',
          }}>
            {[
              { l:'Puan',     v: u.points.toLocaleString('tr-TR'), c:'var(--k3-ink)' },
              { l:'Düello',   v: '24',  c:'var(--k3-ink)' },
              { l:'Galibiyet',v: '14',  c:'var(--k-success)' },
              { l:'Seri',     v: u.streak, icon:'🔥', c:'var(--k3-warm-500)' },
            ].map((s, i) => (
              <div key={s.l} style={{
                padding: isMobile?'10px 0':'0 18px',
                borderRight: !isMobile && i < 3 ? '1px solid var(--k3-rule)' : 'none',
              }}>
                <div className="k3-eyebrow">{s.l}</div>
                <div className="k3-tab k3-h-1" style={{
                  marginTop: 4, fontSize: isMobile?24:30, color: s.c, fontWeight: 800,
                }}>{s.icon && <span style={{ fontSize:'.7em', marginRight: 4 }}>{s.icon}</span>}{s.v}</div>
              </div>
            ))}
          </div>

          {/* Rank progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 7 }}>
              <span className="k3-eyebrow">{u.rank} {u.rankIcon} → {u.nextRank}</span>
              <span className="k3-tab" style={{ font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>
                {u.points} / {u.nextRankAt}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background:'var(--k3-surface-2)', overflow:'hidden' }}>
              <div style={{
                width: (u.points/u.nextRankAt*100) + '%', height:'100%',
                background:'linear-gradient(90deg, var(--k3-warm-400), var(--k3-warm-500))',
                borderRadius: 99,
              }}/>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement strip — mini-cards */}
      <div style={{ display:'grid', gap: 10, gridTemplateColumns: `repeat(${isMobile?2:4}, 1fr)` }}>
        {[
          { l:'3 günlük seri', n:'🔥', c:'var(--k3-warm-500)', d:'Bugün yeniledin' },
          { l:'İlk düello',    n:'⚔️', c:'var(--k-blue-500)',  d:'12 Mayıs'        },
          { l:'Tartışmacı',    n:'🎙️', c:'#7c3aed',            d:'+10 cevap'       },
          { l:'Topluluk oyu',  n:'❤️', c:'#dc2626',            d:'500+ upvote'     },
        ].map(a => (
          <div key={a.l} className="k3-card" style={{
            padding: 12, display:'flex', alignItems:'center', gap: 10,
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12,
              background: `color-mix(in oklab, ${a.c} 14%, white)`,
              display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 18,
            }}>{a.n}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ font:'700 13px var(--k-font-sans)', letterSpacing:'-0.01em' }}>{a.l}</div>
              <div style={{ font:'500 11px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>{a.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 0, borderBottom:'1px solid var(--k3-rule)', overflowX:'auto' }}>
        {tabs.map(t => {
          const id = t.toLowerCase();
          const active = tab === id;
          return (
            <button key={t} onClick={()=>setTab(id)} style={{
              padding:'12px 16px', background:'transparent', border:'none',
              borderBottom: '2px solid ' + (active ? 'var(--k-blue-500)' : 'transparent'),
              color: active ? 'var(--k3-ink)' : 'var(--k3-ink-3)',
              font: `${active?700:500} 13.5px var(--k-font-sans)`, cursor:'pointer',
              whiteSpace:'nowrap', marginBottom: -1, letterSpacing:'-0.005em',
            }}>{t}</button>
          );
        })}
      </div>

      {/* Answer cards */}
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {data.answers.slice(0, 3).map(a => (
          <article key={a.id} className="k3-card" style={{
            padding: 16, borderLeft: `3px solid ${s3SideColor(a.side)}`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
              <SideChipV3 side={a.side}/>
              <ModeChip mode="senaryo"/>
              <span style={{ font:'400 11px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>· {a.time}</span>
              <span className="k3-tab" style={{ marginLeft:'auto', font:'600 12.5px var(--k-font-mono)', color:'var(--k-success)' }}>
                <Icons.arrowUp size={12} style={{ verticalAlign:'-1px' }}/> {a.votes.score.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="k3-eyebrow" style={{ marginBottom: 6 }}>Pazar günü aile ziyaretinde…</div>
            <p style={{
              margin:0, font:'500 15px/1.5 var(--k-font-sans)', color:'var(--k3-ink)',
              textWrap:'pretty', letterSpacing:'-0.005em',
            }}>{a.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  HomeScreenV3, DetailScreenV3, DiscoverScreenV3, LeaderboardScreenV3, ProfileScreenV3,
  SideChipV3, TugBarV3, s3SideColor,
});
