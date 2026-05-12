// Kapisio — screen components (responsive: take `viewport` prop = 'desktop' | 'mobile')
// All screens are pure presentation; state is owned by the App.

const { useState, useMemo } = React;

// ─────────────────────────────────────────────────────────────────────────────
// FEED CARD (used on Home + Discover)
// ─────────────────────────────────────────────────────────────────────────────
const FeedCard = ({ item, onOpen, vp }) => {
  const [myVote, setMyVote] = useState(null);
  const isMobile = vp === 'mobile';
  const isDuel = item.kind === 'duel';
  return (
    <article className="k-card" style={{
      padding: isMobile ? 14 : 16,
      cursor:'pointer',
      transition:'border-color .12s, box-shadow .12s',
    }} onClick={() => onOpen?.(item)}>
      {/* Header: mode + author + time */}
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
        <ModeChip mode={item.mode}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0, flex:1 }}>
          {isDuel ? (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <Icons.swords size={14} style={{ color:'var(--k-text-3)' }}/>
              <Avatar name={item.vs.avatar} color={item.vs.color} size={22}/>
              <span style={{ font:'500 13px var(--k-font-sans)', color:'var(--k-text-2)',
                             overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>
                {item.author.name} <span style={{ color:'var(--k-text-3)' }}>vs</span> {item.vs.name}
              </span>
            </>
          ) : (
            <>
              <Avatar name={item.author.avatar} color={item.author.color} size={22}/>
              <span style={{ font:'500 13px var(--k-font-sans)', color:'var(--k-text)' }}>{item.author.name}</span>
              <span style={{ color:'var(--k-text-3)', font:'400 13px var(--k-font-sans)' }}>·</span>
              <span style={{ color:'var(--k-text-3)', font:'400 12px var(--k-font-mono)' }}>{item.time}</span>
            </>
          )}
        </div>
        <button onClick={(e)=>{e.stopPropagation();}}
                style={{ background:'none', border:'none', color:'var(--k-text-3)', padding:4, cursor:'pointer' }}>
          <Icons.more size={18}/>
        </button>
      </div>

      {/* Title */}
      <h3 style={{
        margin:'0 0 8px', font: `600 ${isMobile?16:17}px/1.35 var(--k-font-sans)`,
        color:'var(--k-text)', letterSpacing:'-0.01em', textWrap:'pretty',
      }}>{item.title}</h3>

      {/* Preview (one line of top answer) */}
      {item.preview && (
        <p style={{
          margin:'0 0 14px', font:`400 14px/1.5 var(--k-font-sans)`,
          color:'var(--k-text-2)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden',
        }}>{item.preview}</p>
      )}

      {/* Duel: vote split bar */}
      {isDuel && (
        <div style={{ margin:'4px 0 14px' }}>
          <VoteSplitBar left={46} right={54} leftLabel={item.author.avatar} rightLabel={item.vs.avatar}
                        leftColor={item.author.color} rightColor={item.vs.color}/>
        </div>
      )}

      {/* Footer: stats + vote */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 2 }}>
          {!isDuel && (
            <VoteRail score={item.vote.up - item.vote.down} dir="row"
                      myVote={myVote} onVote={(v)=>{ setMyVote(v); }} compact/>
          )}
          {isDuel && (
            <StatBtn icon={<Icons.target size={15}/>} label={`Oyla · ${item.stats.votes}`} color="var(--k-blue-500)"/>
          )}
          <StatBtn icon={<Icons.msg size={15}/>} label={item.stats.answers}/>
          <StatBtn icon={<Icons.flame size={15} style={{color:'var(--k-coral-500)'}}/>}
                   label={item.stats.fire}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 2 }}>
          <StatBtn icon={<Icons.bookmark size={15}/>}/>
          <StatBtn icon={<Icons.share size={15}/>}/>
        </div>
      </div>
    </article>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO — Today's Scenario (top of Anasayfa)
// ─────────────────────────────────────────────────────────────────────────────
const TodayHero = ({ vp, onOpen, scenario }) => {
  const isMobile = vp === 'mobile';
  return (
    <section style={{
      position:'relative', overflow:'hidden',
      borderRadius:'var(--k-r-xl)',
      background:'linear-gradient(135deg, #1442a8 0%, #2a6cf0 55%, #5188fa 100%)',
      color:'#fff', padding: isMobile ? 18 : 24,
      boxShadow:'var(--k-shadow-md)',
    }}>
      {/* Decorative shapes */}
      <div aria-hidden style={{
        position:'absolute', right:-40, top:-40, width:200, height:200,
        borderRadius:'50%', background:'rgba(255,255,255,0.08)',
      }}/>
      <div aria-hidden style={{
        position:'absolute', right:40, bottom:-30, width:120, height:120,
        borderRadius:'50%', background:'rgba(255,255,255,0.05)',
      }}/>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    gap:8, marginBottom: 14, position:'relative' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                      background:'rgba(255,255,255,0.16)', padding:'4px 10px',
                      borderRadius:'var(--k-r-pill)',
                      font:'600 11px var(--k-font-sans)', letterSpacing:'.08em', textTransform:'uppercase' }}>
          <Icons.bolt size={12}/> Günün Senaryosu · {scenario.date}
        </div>
        <div style={{ font:'500 12px var(--k-font-mono)', opacity:.85,
                      display:'inline-flex', alignItems:'center', gap:6 }}>
          <Icons.clock size={13}/> Yeni: {scenario.countdown}
        </div>
      </div>

      <h2 style={{
        margin:'0 0 18px', font:`700 ${isMobile?20:26}px/1.25 var(--k-font-sans)`,
        letterSpacing:'-0.02em', textWrap:'pretty',
      }}>{scenario.title}</h2>

      {/* Already answered state */}
      {scenario.answered ? (
        <div style={{ display:'flex', flexDirection:'column', gap: 12, position:'relative' }}>
          <div style={{ background:'rgba(255,255,255,0.14)', borderRadius:'var(--k-r-md)',
                        padding:'10px 14px', font:'500 14px var(--k-font-sans)',
                        display:'flex', alignItems:'center', gap: 10 }}>
            <Icons.check size={16} style={{ color:'#bff5d5' }}/>
            <span style={{ opacity:.85 }}>Cevabın:</span>
            <span style={{ fontWeight:600 }}>“{scenario.yourAnswer}”</span>
          </div>
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
            <button className="k-btn" onClick={(e)=>{e.stopPropagation(); onOpen?.();}}
                    style={{ background:'#fff', color:'var(--k-blue-700)', flex: isMobile?'1 1 100%':'0 0 auto', height: 40 }}>
              <Icons.swords size={16}/> Hızlı Düello
            </button>
            <button className="k-btn" onClick={(e)=>{e.stopPropagation(); onOpen?.();}}
                    style={{ background:'rgba(255,255,255,0.16)', color:'#fff', flex: isMobile?'1 1 100%':'0 0 auto', height: 40 }}>
              <Icons.target size={16}/> İsimli Düello
            </button>
            <button className="k-btn" onClick={(e)=>{e.stopPropagation(); onOpen?.();}}
                    style={{ background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', height: 40 }}>
              {scenario.answersCount} cevabı gör <Icons.arrowRight size={14}/>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', gap: 8 }}>
          <button className="k-btn" style={{ background:'#fff', color:'var(--k-blue-700)', height: 40 }}>
            <Icons.bolt size={16}/> Cevabını yaz
          </button>
        </div>
      )}
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME (Anasayfa)
// ─────────────────────────────────────────────────────────────────────────────
const HomeScreen = ({ vp, onOpenScenario, data }) => {
  const isMobile = vp === 'mobile';
  const [filter, setFilter] = useState('top');
  const filters = [
    { id:'top',     label:'En çok oylanan', icon:<Icons.trophy size={14}/> },
    { id:'new',     label:'Yeni',           icon:<Icons.bolt size={14}/> },
    { id:'duels',   label:'Düellolar',      icon:<Icons.swords size={14}/> },
    { id:'follow',  label:'Takip',          icon:<Icons.user size={14}/> },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 14 : 18 }}>
      <TodayHero vp={vp} scenario={data.todayScenario} onOpen={() => onOpenScenario(data.todayScenario)}/>

      {/* Filter chips */}
      <div style={{
        display:'flex', gap: 6, overflowX:'auto', padding: '2px 0',
        margin: isMobile ? '0 -16px' : 0, paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0,
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'0 12px', height: 32, borderRadius:'var(--k-r-pill)',
            border:'1px solid ' + (filter === f.id ? 'transparent' : 'var(--k-border)'),
            background: filter === f.id ? 'var(--k-text)' : 'var(--k-bg-elev)',
            color: filter === f.id ? '#fff' : 'var(--k-text-2)',
            font:'500 13px var(--k-font-sans)', cursor:'pointer', whiteSpace:'nowrap',
          }}>{f.icon}{f.label}</button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 10 : 12 }}>
        {data.feed.map(it => (
          <FeedCard key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO DETAIL — primary read+vote screen
// ─────────────────────────────────────────────────────────────────────────────
const AnswerRow = ({ a, vp }) => {
  const [vote, setVote] = useState(null);
  const sideColor = a.side === 'sicak' ? 'var(--k-coral-500)' : 'var(--k-blue-500)';
  const sideLabel = a.side === 'sicak' ? 'Sıcak' : 'Soğuk';
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', gap: 12, padding: isMobile ? '14px 0' : '16px 0',
                  borderBottom:'1px solid var(--k-border)' }}>
      {!isMobile && <VoteRail score={a.votes.score} myVote={vote} onVote={setVote}/>}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
          <Avatar name={a.author.avatar} color={a.author.color} size={28}/>
          <span style={{ font:'600 13.5px var(--k-font-sans)' }}>{a.author.name}</span>
          <RankPill rank={a.author.rank} icon={a.author.rankIcon}/>
          <span style={{ color:'var(--k-text-3)', font:'400 12px var(--k-font-mono)' }}>· {a.time}</span>
          <span style={{
            marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:4,
            padding:'2px 8px', borderRadius:'var(--k-r-pill)',
            background: sideColor + '14', color: sideColor,
            font:'600 11px var(--k-font-sans)',
          }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background: sideColor }}/>
            {sideLabel}
          </span>
          {a.gilded && <span title="Ödüllü cevap" style={{ fontSize: 14 }}>🏅</span>}
        </div>
        <p style={{ margin:'0 0 10px', font:'400 14.5px/1.55 var(--k-font-sans)',
                    color:'var(--k-text)', textWrap:'pretty' }}>{a.body}</p>
        <div style={{ display:'flex', alignItems:'center', gap: 2, flexWrap:'wrap' }}>
          {isMobile && <VoteRail score={a.votes.score} myVote={vote} onVote={setVote} dir="row" compact/>}
          <StatBtn icon={<Icons.reply size={14}/>} label={`${a.replies} yanıt`}/>
          <StatBtn icon={<Icons.swords size={14}/>} label="Düello"/>
          <StatBtn icon={<Icons.bookmark size={14}/>}/>
          <StatBtn icon={<Icons.share size={14}/>}/>
        </div>
      </div>
    </div>
  );
};

const DetailScreen = ({ vp, data, onBack }) => {
  const s = data.todayScenario;
  const [sort, setSort] = useState('top');
  const [mode, setMode] = useState('senaryo');
  const isMobile = vp === 'mobile';
  const modes = ['senaryo','emoji','karakter','tartisma'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      {/* Mode tabs */}
      <div className="k-card" style={{ padding: 6, display:'flex', gap: 4 }}>
        {modes.map(m => {
          const info = window.MODE_INFO[m];
          const active = mode === m;
          return (
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1, display:'flex', flexDirection: isMobile ? 'column':'row', gap: 6,
              alignItems:'center', justifyContent:'center',
              padding: isMobile ? '8px 4px' : '8px 10px',
              borderRadius: 8,
              background: active ? `color-mix(in oklab, ${info.color} 12%, white)` : 'transparent',
              color: active ? info.color : 'var(--k-text-2)',
              border:'none', font:`${active?600:500} 13px var(--k-font-sans)`, cursor:'pointer',
            }}>
              <span style={{ fontSize: 14 }}>{info.emoji}</span>{info.label}
            </button>
          );
        })}
      </div>

      {/* Scenario card */}
      <div className="k-card" style={{ padding: isMobile ? 18 : 24 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12, flexWrap:'wrap' }}>
          <ModeChip mode={mode} size="lg"/>
          <span style={{ font:'600 11px var(--k-font-sans)', letterSpacing:'.06em',
                         textTransform:'uppercase', color:'var(--k-text-3)' }}>
            Günün Senaryosu · {s.date}
          </span>
          <span style={{ marginLeft:'auto', font:'500 12px var(--k-font-mono)',
                         display:'inline-flex', alignItems:'center', gap: 4, color:'var(--k-text-3)' }}>
            <Icons.clock size={13}/> {s.countdown}
          </span>
        </div>
        <h1 style={{
          margin:'0 0 16px', font:`700 ${isMobile?22:28}px/1.25 var(--k-font-sans)`,
          letterSpacing:'-0.02em', textWrap:'pretty',
        }}>{s.title}</h1>

        {/* Live vote split */}
        <div style={{ marginBottom: 18 }}>
          <VoteSplitBar
            left={s.voteSplit.sicak} right={s.voteSplit.soguk}
            leftLabel="Sıcak" rightLabel="Soğuk"
            leftColor="var(--k-coral-500)" rightColor="var(--k-blue-500)"
          />
          <div style={{ marginTop: 6, font:'400 12px var(--k-font-sans)', color:'var(--k-text-3)' }}>
            {s.answersCount.toLocaleString('tr-TR')} cevap · {s.duellosLive} aktif düello
          </div>
        </div>

        {/* Side selector + answer input */}
        <div style={{ display:'flex', gap: 8, marginBottom: 10, flexWrap:'wrap' }}>
          <button className="k-btn k-btn-outline" style={{ flex:1, minWidth: 140 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--k-coral-500)' }}/> Sıcak'ı seç
          </button>
          <button className="k-btn k-btn-outline" style={{ flex:1, minWidth: 140,
                                                            background:'var(--k-blue-50)', borderColor:'var(--k-blue-200)', color:'var(--k-blue-700)' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--k-blue-500)' }}/> Soğuk'u seç ✓
          </button>
        </div>
        <div style={{ position:'relative', marginBottom: 10 }}>
          <textarea defaultValue={s.yourAnswer} rows={3}
            style={{
              width:'100%', resize:'none', font:'400 14.5px/1.5 var(--k-font-sans)',
              border:'1px solid var(--k-border)', borderRadius:'var(--k-r-md)',
              padding:'12px 14px', background:'var(--k-bg-soft)',
              color:'var(--k-text)', outline:'none',
            }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop: 6 }}>
            <span style={{ font:'400 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>14 / 280</span>
            <div style={{ display:'flex', gap: 6 }}>
              <button className="k-btn k-btn-ghost" style={{ height: 32, padding:'0 12px', fontSize:13 }}>İptal</button>
              <button className="k-btn k-btn-primary" style={{ height: 32, padding:'0 14px', fontSize:13 }}>Güncelle</button>
            </div>
          </div>
        </div>
      </div>

      {/* Answers list */}
      <div className="k-card" style={{ padding: isMobile ? '4px 16px' : '4px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                       padding:'14px 0 4px', borderBottom:'1px solid var(--k-border)', marginBottom: 4 }}>
          <h3 style={{ margin:0, font:'600 15px var(--k-font-sans)' }}>
            Cevaplar · <span style={{ color:'var(--k-text-3)' }}>{s.answersCount.toLocaleString('tr-TR')}</span>
          </h3>
          <div style={{ display:'flex', gap: 4 }}>
            {[{id:'top',l:'Top'},{id:'new',l:'Yeni'},{id:'duel',l:'Düello'}].map(t => (
              <button key={t.id} onClick={()=>setSort(t.id)} style={{
                padding:'6px 10px', borderRadius: 8, border:'none',
                background: sort === t.id ? 'var(--k-bg-soft)' : 'transparent',
                color: sort === t.id ? 'var(--k-text)' : 'var(--k-text-3)',
                font:`${sort===t.id?600:500} 12px var(--k-font-sans)`, cursor:'pointer',
              }}>{t.l}</button>
            ))}
          </div>
        </div>
        {data.answers.map(a => <AnswerRow key={a.id} a={a} vp={vp}/>)}
        <div style={{ padding:'14px 0', textAlign:'center' }}>
          <button className="k-btn k-btn-ghost" style={{ color:'var(--k-blue-500)' }}>
            243 cevap daha gör <Icons.arrowDown size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KEŞFET — Discover
// ─────────────────────────────────────────────────────────────────────────────
const DiscoverScreen = ({ vp, data, onOpenScenario }) => {
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
      {/* Search */}
      <div style={{ position:'relative' }}>
        <Icons.search size={18} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--k-text-3)' }}/>
        <input placeholder="Senaryo, düello, kullanıcı ara…" style={{
          width:'100%', height: 44, paddingLeft: 42, paddingRight: 14,
          font:'400 14.5px var(--k-font-sans)',
          border:'1px solid var(--k-border)', borderRadius:'var(--k-r-pill)',
          background:'var(--k-bg-elev)', color:'var(--k-text)', outline:'none',
        }}/>
      </div>

      <div>
        <SectionTitle action={<button className="k-btn k-btn-ghost" style={{ fontSize:12, height:26, padding:'0 8px', color:'var(--k-blue-500)' }}>Tümü</button>}>
          Kategoriler
        </SectionTitle>
        <div style={{
          display:'grid', gap: 10,
          gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
        }}>
          {data.discoverCats.map(c => (
            <button key={c.id} className="k-card" style={{
              padding: 14, display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 6,
              background:'var(--k-bg-elev)', cursor:'pointer', textAlign:'left',
              transition:'transform .12s, box-shadow .12s',
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: `color-mix(in oklab, ${c.color} 14%, white)`,
                color: c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>{c.emoji}</span>
              <span style={{ font:'600 14px var(--k-font-sans)' }}>{c.label}</span>
              <span style={{ font:'400 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Yükselen Senaryolar</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
          {data.feed.slice(0, 3).map(it => (
            <FeedCard key={it.id} item={it} vp={vp} onOpen={onOpenScenario}/>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD — Liderlik
// ─────────────────────────────────────────────────────────────────────────────
const LeaderboardScreen = ({ vp, data }) => {
  const [scope, setScope] = useState('week');
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <div style={{
        background:'linear-gradient(135deg, #5188fa, #1c2f6e)',
        color:'#fff', padding: isMobile ? 18 : 24,
        borderRadius:'var(--k-r-xl)', position:'relative', overflow:'hidden',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <Icons.trophy size={24}/>
          <h1 style={{ margin:0, font:'700 22px/1.1 var(--k-font-sans)', letterSpacing:'-0.02em' }}>Liderlik</h1>
        </div>
        <p style={{ margin:'8px 0 0', font:'400 14px var(--k-font-sans)', opacity:.92 }}>
          En çok oy alan, en çok düello kazanan oyuncular.
        </p>
        <div style={{ display:'flex', gap:6, marginTop: 14 }}>
          {[{id:'day',l:'Bugün'},{id:'week',l:'Bu Hafta'},{id:'month',l:'Ay'},{id:'all',l:'Tüm Zaman'}].map(s => (
            <button key={s.id} onClick={()=>setScope(s.id)} style={{
              padding:'6px 12px', borderRadius:'var(--k-r-pill)', border:'none',
              background: scope===s.id ? '#fff' : 'rgba(255,255,255,0.18)',
              color: scope===s.id ? 'var(--k-coral-600)' : '#fff',
              font:`${scope===s.id?600:500} 12.5px var(--k-font-sans)`, cursor:'pointer',
            }}>{s.l}</button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {!isMobile && (
        <div className="k-card" style={{ padding: 24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 14, alignItems:'end' }}>
          {[1,0,2].map(idx => {
            const u = data.leaderboard[idx];
            const heights = [120, 150, 100];
            const colors = ['#cbd5e1', '#fbbf24', '#ea580c'];
            const realIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
            return (
              <div key={u.handle} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 8 }}>
                <Avatar name={u.avatar} color={u.color} size={56} badge={u.badge}/>
                <div style={{ font:'600 14px var(--k-font-sans)' }}>{u.name}</div>
                <div style={{ font:'500 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>{u.points.toLocaleString('tr-TR')} puan</div>
                <div style={{
                  width:'100%', height: heights[realIdx], background: colors[realIdx],
                  borderRadius: '10px 10px 0 0', display:'flex', alignItems:'center', justifyContent:'center',
                  font:'800 32px var(--k-font-sans)', color:'#fff',
                }}>{u.rank}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="k-card" style={{ overflow:'hidden' }}>
        {data.leaderboard.map((u, i) => (
          <div key={u.handle} style={{
            display:'flex', alignItems:'center', gap: 12, padding:'12px 16px',
            borderBottom: i === data.leaderboard.length-1 ? 'none' : '1px solid var(--k-border)',
            background: u.handle === 'cesurr' ? 'var(--k-blue-50)' : 'transparent',
          }}>
            <span style={{
              width: 28, textAlign:'center', font:'700 14px var(--k-font-mono)',
              color: u.rank <= 3 ? 'var(--k-coral-500)' : 'var(--k-text-3)',
            }}>{u.rank}</span>
            <Avatar name={u.avatar} color={u.color} size={36}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ font:'600 14px var(--k-font-sans)' }}>{u.name} <span style={{ marginLeft:4, fontSize:13 }}>{u.badge}</span></div>
              <div style={{ font:'400 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>@{u.handle}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ font:'600 14px var(--k-font-mono)' }}>{u.points.toLocaleString('tr-TR')}</div>
              <div style={{ font:'500 11px var(--k-font-mono)',
                            color: u.delta.startsWith('+') ? 'var(--k-success)' : u.delta.startsWith('-') ? 'var(--k-coral-500)' : 'var(--k-text-3)' }}>
                {u.delta} bu hafta
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — Bildirimler
// ─────────────────────────────────────────────────────────────────────────────
const NotifIcon = ({ kind }) => {
  const map = {
    duel:    { icon:<Icons.swords size={16}/>, c:'var(--k-coral-500)' },
    vote:    { icon:<Icons.arrowUp size={16}/>, c:'var(--k-success)' },
    badge:   { icon:<Icons.trophy size={16}/>, c:'var(--k-sky-500)' },
    follow:  { icon:<Icons.user size={16}/>, c:'var(--k-blue-500)' },
    mention: { icon:<span style={{ fontWeight:700, fontSize:14 }}>@</span>, c:'var(--k-mode-karakter)' },
  };
  const m = map[kind] || map.vote;
  return (
    <span style={{
      width: 32, height: 32, borderRadius:'50%',
      background: `color-mix(in oklab, ${m.c} 14%, white)`,
      color: m.c, display:'flex', alignItems:'center', justifyContent:'center', flex:'none',
    }}>{m.icon}</span>
  );
};

const NotificationsScreen = ({ vp, data }) => {
  const [tab, setTab] = useState('all');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ margin:0, font:'700 22px var(--k-font-sans)', letterSpacing:'-0.02em' }}>Bildirimler</h1>
        <button className="k-btn k-btn-ghost" style={{ color:'var(--k-blue-500)', fontSize:13, height:32 }}>Tümünü okundu say</button>
      </div>
      <div style={{ display:'flex', gap: 6 }}>
        {[{id:'all',l:'Tümü'},{id:'duel',l:'Düellolar'},{id:'mention',l:'Bahsetmeler'}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'8px 14px', borderRadius:'var(--k-r-pill)', border:'1px solid ' + (tab===t.id ? 'transparent' : 'var(--k-border)'),
            background: tab===t.id ? 'var(--k-text)' : 'var(--k-bg-elev)',
            color: tab===t.id ? '#fff' : 'var(--k-text-2)',
            font:'500 13px var(--k-font-sans)', cursor:'pointer',
          }}>{t.l}</button>
        ))}
      </div>
      <div className="k-card" style={{ overflow:'hidden' }}>
        {data.notifications.map((n, i) => (
          <div key={n.id} style={{
            display:'flex', alignItems:'flex-start', gap: 12, padding:'14px 16px',
            borderBottom: i === data.notifications.length-1 ? 'none' : '1px solid var(--k-border)',
            background: i < 2 ? 'var(--k-blue-50)' : 'transparent',
          }}>
            <NotifIcon kind={n.kind}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ font:'400 14px var(--k-font-sans)' }}>
                <strong>{n.who}</strong> {n.text}
              </div>
              {n.target && (
                <div style={{ marginTop: 4, font:'400 13px var(--k-font-sans)', color:'var(--k-text-3)',
                              padding:'6px 10px', background:'var(--k-bg-soft)', borderRadius: 8, display:'inline-block' }}>
                  {n.target}
                </div>
              )}
              <div style={{ marginTop: 4, font:'400 11px var(--k-font-mono)', color:'var(--k-text-3)' }}>{n.time} önce</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE — Profil
// ─────────────────────────────────────────────────────────────────────────────
const ProfileScreen = ({ vp, data }) => {
  const [tab, setTab] = useState('cevaplar');
  const u = data.user;
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      {/* Cover + info */}
      <div className="k-card" style={{ overflow:'hidden', padding: 0 }}>
        <div style={{
          height: isMobile ? 100 : 140,
          background:'linear-gradient(135deg, #0f4a8a 0%, #2a6cf0 100%)',
          position:'relative',
        }}>
          <div aria-hidden style={{ position:'absolute', inset:0, background:
            'radial-gradient(at 20% 60%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(at 80% 30%, rgba(243,137,92,0.25), transparent 60%)' }}/>
        </div>
        <div style={{ padding: isMobile ? '0 16px 16px' : '0 24px 22px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap: 14, marginTop: isMobile ? -32 : -42 }}>
            <Avatar name={u.avatar} color={u.avatarColor} size={isMobile ? 70 : 90} ring="#fff"/>
            <div style={{ flex:1, minWidth: 0, paddingBottom: 8 }}>
              <h1 style={{ margin:0, font:`700 ${isMobile?20:24}px var(--k-font-sans)`, letterSpacing:'-0.02em' }}>{u.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 2,
                            font:'400 13px var(--k-font-mono)', color:'var(--k-text-3)' }}>
                @{u.handle} · <RankPill rank={u.rank} icon={u.rankIcon}/>
              </div>
            </div>
            {!isMobile && (
              <div style={{ display:'flex', gap: 8 }}>
                <button className="k-btn k-btn-outline">Düzenle</button>
                <button className="k-btn k-btn-primary"><Icons.swords size={14}/> Düello at</button>
              </div>
            )}
          </div>
          {isMobile && (
            <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
              <button className="k-btn k-btn-outline" style={{ flex:1 }}>Düzenle</button>
              <button className="k-btn k-btn-primary" style={{ flex:1 }}><Icons.swords size={14}/> Düello at</button>
            </div>
          )}

          {/* Stats row */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8,
            marginTop: 16, padding:'14px 0 0', borderTop:'1px solid var(--k-border)',
          }}>
            {[
              { l:'Puan',     v: u.points.toLocaleString('tr-TR') },
              { l:'Düello',   v: '24' },
              { l:'Galibiyet',v: '14' },
              { l:'Seri',     v: u.streak + '🔥' },
            ].map(s => (
              <div key={s.l} style={{ textAlign:'center' }}>
                <div style={{ font:'700 18px var(--k-font-mono)' }}>{s.v}</div>
                <div style={{ font:'500 11px var(--k-font-sans)', color:'var(--k-text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Rank progress */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
                          font:'500 12px var(--k-font-sans)', marginBottom: 6 }}>
              <span><RankPill rank={u.rank} icon={u.rankIcon}/></span>
              <span style={{ color:'var(--k-text-3)' }}>{u.points} / {u.nextRankAt} → {u.nextRank}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background:'var(--k-bg-soft)', overflow:'hidden' }}>
              <div style={{ width: (u.points/u.nextRankAt*100) + '%', height:'100%',
                            background:'linear-gradient(90deg, var(--k-coral-400), var(--k-coral-500))' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 4, borderBottom:'1px solid var(--k-border)', overflowX:'auto' }}>
        {['Vitrin','Cevaplar','Düellolar','Senaryolar','Başarımlar','İstatistik'].map(t => {
          const id = t.toLowerCase().replace(/\W/g,'');
          const active = tab === (id === 'vitrin' ? 'vitrin' : id);
          return (
            <button key={t} onClick={() => setTab(id)} style={{
              padding:'10px 14px', background:'transparent', border:'none',
              borderBottom: '2px solid ' + (active ? 'var(--k-blue-500)' : 'transparent'),
              color: active ? 'var(--k-text)' : 'var(--k-text-3)',
              font: `${active?600:500} 13.5px var(--k-font-sans)`, cursor:'pointer', whiteSpace:'nowrap',
            }}>{t}</button>
          );
        })}
      </div>

      {/* Tab content — sample answer cards */}
      <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
        {data.answers.slice(0, 3).map(a => (
          <div key={a.id} className="k-card" style={{ padding: 16 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
              <ModeChip mode="senaryo"/>
              <span style={{ font:'500 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>· {a.time}</span>
              <span style={{ marginLeft:'auto', font:'500 12px var(--k-font-mono)', color:'var(--k-text-3)',
                            display:'inline-flex', alignItems:'center', gap: 4 }}>
                <Icons.arrowUp size={14} style={{ color:'var(--k-success)' }}/> {a.votes.score}
              </span>
            </div>
            <div style={{ font:'500 13.5px var(--k-font-sans)', color:'var(--k-text-3)', marginBottom: 6 }}>
              cevap → Pazar günü aile ziyaretinde…
            </div>
            <div style={{ font:'400 14.5px/1.5 var(--k-font-sans)' }}>{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — Senaryo Oluştur (modal/sheet)
// ─────────────────────────────────────────────────────────────────────────────
const CreateModal = ({ vp, onClose }) => {
  const [mode, setMode] = useState('senaryo');
  const modes = ['senaryo','emoji','karakter','tartisma'];
  const isMobile = vp === 'mobile';
  return (
    <div style={{
      position:'absolute', inset: 0, background:'rgba(15,19,32,0.45)',
      display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center',
      zIndex: 100, padding: isMobile ? 0 : 24, animation:'kFadeIn .15s ease',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--k-bg-elev)', borderRadius: isMobile ? '20px 20px 0 0' : 'var(--k-r-xl)',
        width: '100%', maxWidth: isMobile ? '100%' : 560, padding: isMobile ? 18 : 24,
        boxShadow:'var(--k-shadow-pop)', maxHeight: '92%', overflowY:'auto',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 16 }}>
          <h2 style={{ margin:0, font:'700 18px var(--k-font-sans)' }}>Senaryo oluştur</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--k-text-3)' }}>
            <Icons.x size={18}/>
          </button>
        </div>
        <div style={{ display:'flex', gap: 6, marginBottom: 14, flexWrap:'wrap' }}>
          {modes.map(m => {
            const info = window.MODE_INFO[m];
            const active = mode === m;
            return (
              <button key={m} onClick={()=>setMode(m)} style={{
                padding:'8px 12px', borderRadius:'var(--k-r-pill)', border:'1px solid ' + (active ? 'transparent' : 'var(--k-border)'),
                background: active ? `color-mix(in oklab, ${info.color} 12%, white)` : 'var(--k-bg-elev)',
                color: active ? info.color : 'var(--k-text-2)',
                font:`${active?600:500} 13px var(--k-font-sans)`, cursor:'pointer',
                display:'inline-flex', gap:6, alignItems:'center',
              }}>{info.emoji} {info.label}</button>
            );
          })}
        </div>
        <textarea rows={5} placeholder="Senaryonu yaz — bir karar, bir ikilem, bir soru…" style={{
          width:'100%', resize:'none', font:'400 15px/1.5 var(--k-font-sans)',
          border:'1px solid var(--k-border)', borderRadius:'var(--k-r-md)',
          padding:'14px 16px', background:'var(--k-bg-soft)', color:'var(--k-text)', outline:'none',
        }}/>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 14 }}>
          <span style={{ font:'400 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>0 / 280</span>
          <div style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
            <button className="k-btn k-btn-outline">Taslak kaydet</button>
            <button className="k-btn k-btn-primary">Yayınla</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  HomeScreen, DetailScreen, DiscoverScreen, LeaderboardScreen, NotificationsScreen, ProfileScreen, CreateModal,
});
