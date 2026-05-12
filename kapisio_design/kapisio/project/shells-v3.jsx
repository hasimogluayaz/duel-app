// Kapisio v3 — Desktop + Mobile shells (refined v1)

const { useState: useSh3 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP
// ─────────────────────────────────────────────────────────────────────────────
const D3NavItem = ({ icon, label, active, badge, onClick }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap: 12, width:'100%',
    padding:'10px 12px', borderRadius: 12,
    background: active ? 'var(--k-blue-50)' : 'transparent',
    color: active ? 'var(--k-blue-700)' : 'var(--k3-ink)',
    border:'none', cursor:'pointer', textAlign:'left',
    font: `${active?700:500} 14.5px var(--k-font-sans)`,
    letterSpacing: active ? '-0.005em' : 0,
    transition:'background .12s',
    position:'relative',
  }}>
    <span style={{ color: active ? 'var(--k-blue-600)' : 'var(--k3-ink-2)',
                     display:'inline-flex' }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge && (
      <span style={{
        background: active ? 'var(--k-blue-500)' : 'var(--k3-warm-500)', color:'#fff',
        font:'700 10px var(--k-font-mono)', padding:'2px 7px', borderRadius: 99, minWidth: 18, textAlign:'center',
      }}>{badge}</span>
    )}
    {active && (
      <span style={{ position:'absolute', left: -14, top: 8, bottom: 8, width: 3,
                       background:'var(--k-blue-500)', borderRadius:'0 4px 4px 0' }}/>
    )}
  </button>
);

const DesktopShellV3 = ({ screen, setScreen, openCreate, data, children }) => {
  const nav = [
    { k:'home',     l:'Anasayfa',    icon:<Icons.home size={19}/> },
    { k:'discover', l:'Keşfet',      icon:<Icons.compass size={19}/> },
    { k:'leader',   l:'Liderlik',    icon:<Icons.trophy size={19}/> },
    { k:'notif',    l:'Bildirimler', icon:<Icons.bell size={19}/>,  b: 6 },
    { k:'messages', l:'Mesajlar',    icon:<Icons.msg size={19}/>,   b: 3 },
    { k:'archive',  l:'Arşiv',       icon:<Icons.archive size={19}/> },
    { k:'saved',    l:'Kaydettiklerim', icon:<Icons.bookmark size={19}/> },
    { k:'profile',  l:'Profil',      icon:<Icons.user size={19}/> },
    { k:'settings', l:'Ayarlar',     icon:<Icons.settings size={19}/> },
  ];

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'264px 1fr 320px',
      minHeight:'100%', background:'var(--k3-bg)',
    }}>
      {/* LEFT SIDEBAR */}
      <aside style={{
        borderRight:'1px solid var(--k3-rule)', background:'var(--k3-surface)',
        padding:'18px 14px', display:'flex', flexDirection:'column', gap: 3,
        position:'sticky', top: 0, height:'100vh',
      }}>
        <div style={{ padding:'4px 8px 14px' }}><KapisioLogo size={28}/></div>

        {nav.map(n => (
          <D3NavItem key={n.k} icon={n.icon} label={n.l} badge={n.b}
                     active={screen===n.k} onClick={()=>setScreen(n.k)}/>
        ))}

        <button className="k3-btn k3-btn-primary" onClick={openCreate} style={{
          height: 46, marginTop: 14, width:'100%', fontSize: 14, fontWeight: 700,
          letterSpacing: '-0.005em',
        }}>
          <Icons.plus size={18}/> Senaryo Oluştur
        </button>

        {/* Streak card */}
        <div style={{
          marginTop:'auto', padding: 14, borderRadius: 14,
          background:'linear-gradient(140deg, var(--k3-warm-500), var(--k3-warm-600))',
          color:'#fff', boxShadow:'0 8px 20px -8px rgba(237,111,28,0.4)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <Icons.flame size={22}/>
            <div style={{ flex: 1 }}>
              <div style={{ font:'800 16px var(--k-font-sans)', letterSpacing:'-0.01em' }}>
                <span className="k3-tab">{data.user.streak}</span> günlük seri
              </div>
              <div style={{ font:'500 11.5px var(--k-font-sans)', opacity:.85, marginTop: 1 }}>
                Bugünü cevapla, seri kopmasın.
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap: 4, marginTop: 12 }}>
            {[1,1,1,1,0,0,0].map((d,i)=>(
              <span key={i} style={{
                flex:1, height: 4, borderRadius: 99,
                background: d ? '#fff' : 'rgba(255,255,255,0.25)',
              }}/>
            ))}
          </div>
        </div>

        {/* User chip */}
        <div onClick={()=>setScreen('profile')} style={{
          display:'flex', alignItems:'center', gap: 10, padding: 10,
          borderRadius: 12, cursor:'pointer',
          border:'1px solid var(--k3-rule)', marginTop: 12,
        }}>
          <Avatar name={data.user.avatar} color={data.user.avatarColor} size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font:'600 13.5px var(--k-font-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{data.user.name}</div>
            <div style={{ font:'400 11.5px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>@{data.user.handle}</div>
          </div>
          <Icons.more size={16} style={{ color:'var(--k3-ink-3)' }}/>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ minWidth: 0 }}>
        <div style={{
          position:'sticky', top: 0, zIndex: 5,
          background:'rgba(244,246,250,0.85)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          borderBottom:'1px solid var(--k3-rule)',
          padding:'14px 24px', display:'flex', alignItems:'center', gap: 12,
        }}>
          <h1 className="k3-h-2" style={{ margin: 0, fontSize: 22 }}>
            {{
              home:'Anasayfa', discover:'Keşfet', detail:'Günün Senaryosu',
              notif:'Bildirimler', leader:'Liderlik', profile:'Profil',
              messages:'Mesajlar', archive:'Arşiv', saved:'Kaydettiklerim', settings:'Ayarlar',
            }[screen] || 'Kapisio'}
          </h1>
          <div style={{ flex: 1, maxWidth: 360, marginLeft: 16, position:'relative' }}>
            <Icons.search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--k3-ink-3)' }}/>
            <input placeholder="Ara…" style={{
              width:'100%', height: 38, paddingLeft: 38, paddingRight: 14,
              font:'400 13.5px var(--k-font-sans)',
              border:'1px solid var(--k3-rule)', borderRadius: 12,
              background:'var(--k3-surface)', color:'var(--k3-ink)', outline:'none',
            }}/>
          </div>
          <button onClick={()=>setScreen('notif')} style={{
            background:'var(--k3-surface)', border:'1px solid var(--k3-rule)', borderRadius: 12,
            width: 38, height: 38, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--k3-ink)', position:'relative',
          }}>
            <Icons.bell size={17}/>
            <span style={{
              position:'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius:'50%',
              background:'var(--k3-warm-500)', border:'1.5px solid #fff',
            }}/>
          </button>
          <Avatar name={data.user.avatar} color={data.user.avatarColor} size={38}/>
        </div>

        <div style={{ padding:'24px 24px 60px', maxWidth: 820, margin:'0 auto' }}>
          {children}
        </div>
      </main>

      {/* RIGHT RAIL */}
      <aside style={{
        borderLeft:'1px solid var(--k3-rule)', background:'var(--k3-surface)',
        padding:'18px 18px', display:'flex', flexDirection:'column', gap: 20,
        position:'sticky', top: 0, height:'100vh', overflowY:'auto',
      }}>
        {/* Today pulse */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow" style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
              <span className="k3-live-dot"/> Bugün · canlı
            </span>
          </div>
          <div className="k3-card" style={{ padding: 14, background:'var(--k3-bg)', boxShadow:'none' }}>
            <TugBarV3 warm={38} cool={62} compact/>
            <div className="k3-tab" style={{
              display:'flex', justifyContent:'space-between', marginTop: 12,
              font:'500 11.5px var(--k-font-mono)', color:'var(--k3-ink-3)',
            }}>
              <span>247 cevap</span>
              <span style={{ display:'inline-flex', gap: 4, alignItems:'center' }}>
                <Icons.swords size={11} style={{ color:'var(--k3-warm-500)' }}/> 12 düello
              </span>
            </div>
          </div>
        </div>

        {/* Trending tags */}
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow">Trend etiketler</span>
            <Icons.flame size={12} style={{ color:'var(--k3-warm-500)' }}/>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {data.trendingTopics.map(t => (
              <button key={t.tag} style={{
                display:'inline-flex', alignItems:'center', gap: 6,
                padding:'7px 12px', borderRadius: 99,
                background:'var(--k3-surface-2)', color:'var(--k3-ink-2)',
                border:'none', cursor:'pointer', font:'600 12.5px var(--k-font-sans)',
              }}>
                <span style={{ color:'var(--k-blue-600)' }}>{t.tag}</span>
                <span className="k3-tab" style={{ color:'var(--k3-ink-3)', font:'500 11px var(--k-font-mono)' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mini leaderboard */}
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow">Bu hafta · liderler</span>
            <button onClick={()=>setScreen('leader')} style={{
              background:'none', border:'none', color:'var(--k-blue-600)',
              font:'600 11.5px var(--k-font-sans)', cursor:'pointer',
            }}>Tümü →</button>
          </div>
          <div className="k3-card" style={{ overflow:'hidden', padding: 0 }}>
            {data.leaderboard.slice(0, 4).map((u, i) => (
              <div key={u.handle} style={{
                display:'flex', alignItems:'center', gap: 10, padding:'10px 12px',
                borderBottom: i === 3 ? 'none' : '1px solid var(--k3-rule)',
              }}>
                <span className="k3-tab" style={{
                  width: 20, font:`${u.rank<=3?800:700} 13px var(--k-font-sans)`, textAlign:'center',
                  color: u.rank===1?'#d97706':u.rank===2?'#6b7280':u.rank===3?'#b45309':'var(--k3-ink-3)',
                }}>{u.rank}</span>
                <Avatar name={u.avatar} color={u.color} size={28}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font:'600 13px var(--k-font-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.name}
                  </div>
                </div>
                <div className="k3-tab" style={{ font:'700 12.5px var(--k-font-mono)', color:'var(--k3-ink-2)' }}>
                  {(u.points/1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Follow suggestions */}
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k3-eyebrow">Tanıyor olabilirsin</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 4 }}>
            {[
              { n:'Ela H.',  h:'elahas', a:'E', c:'#1f8df0', b:'🏆' },
              { n:'Cesur',   h:'cesurr', a:'C', c:'#1c2f6e', b:'⚔️' },
              { n:'Lara K.', h:'larak',  a:'L', c:'#2a6cf0', b:'⚔️' },
            ].map(u => (
              <div key={u.h} style={{ display:'flex', alignItems:'center', gap: 10, padding:'6px 0' }}>
                <Avatar name={u.a} color={u.c} size={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font:'600 13px var(--k-font-sans)', display:'flex', alignItems:'center', gap: 4 }}>{u.n} <span style={{ fontSize:11 }}>{u.b}</span></div>
                  <div style={{ font:'400 11px var(--k-font-mono)', color:'var(--k3-ink-3)' }}>@{u.h}</div>
                </div>
                <button className="k3-btn k3-btn-outline" style={{ height: 28, padding:'0 12px', fontSize: 12 }}>
                  Takip
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE
// ─────────────────────────────────────────────────────────────────────────────
const M3Tab = ({ icon, label, active, onClick, badge, primary }) => {
  if (primary) {
    return (
      <button onClick={onClick} style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width: 54, height: 54, borderRadius: 18,
        background: 'linear-gradient(140deg, #4aa8ff, #1442a8)',
        color:'#fff', border:'none', cursor:'pointer',
        boxShadow:'0 8px 22px -4px rgba(42,108,240,0.5)',
        transform:'translateY(-14px)',
      }}><Icons.plus size={24}/></button>
    );
  }
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 3,
      background:'transparent', border:'none', cursor:'pointer',
      color: active ? 'var(--k-blue-600)' : 'var(--k3-ink-3)',
      flex: 1, height:'100%', position:'relative',
    }}>
      <span style={{ position:'relative',
                       padding: active ? '4px 14px' : '4px 8px',
                       background: active ? 'var(--k-blue-50)' : 'transparent',
                       borderRadius: 99, transition:'background .12s, padding .12s' }}>
        {icon}
        {badge && (
          <span style={{
            position:'absolute', top:-2, right: active ? 6 : -7, minWidth: 14, height: 14, padding:'0 3px',
            background:'var(--k3-warm-500)', color:'#fff', borderRadius: 99,
            font:'700 9px var(--k-font-mono)', display:'flex', alignItems:'center', justifyContent:'center',
            border:'1.5px solid var(--k3-bg)',
          }}>{badge}</span>
        )}
      </span>
      <span style={{ font:`${active?700:500} 10px var(--k-font-sans)`, letterSpacing: active ? '-0.005em' : 0 }}>{label}</span>
    </button>
  );
};

const M3MoreSheet = ({ open, onClose, setScreen, data }) => {
  if (!open) return null;
  const go = (s) => { setScreen(s); onClose(); };
  const items = [
    { ic:<Icons.bell size={18}/>,    l:'Bildirimler',  h:'6 yeni',  s:'notif',   b:6, c:'var(--k3-warm-500)' },
    { ic:<Icons.msg size={18}/>,     l:'Mesajlar',     h:'3 yeni',  s:'messages',b:3, c:'var(--k-blue-500)' },
    { ic:<Icons.trophy size={18}/>,  l:'Liderlik',     h:'Bu hafta',s:'leader',  c:'#d97706' },
    { ic:<Icons.archive size={18}/>, l:'Arşiv',        h:'Geçmiş', s:'archive', c:'var(--k3-ink-2)' },
    { ic:<Icons.bookmark size={18}/>,l:'Kaydettiklerim',h:'24 öge', s:'saved',   c:'var(--k-blue-500)' },
    { ic:<Icons.settings size={18}/>,l:'Ayarlar',      h:'Tema · gizlilik', s:'settings', c:'var(--k3-ink-2)' },
  ];
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset: 0, background:'rgba(10,15,30,0.5)', zIndex: 50,
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:'var(--k3-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding:'10px 0 22px', animation:'slideUp .25s ease-out',
      }}>
        <div style={{ width: 40, height: 4, background:'var(--k3-rule-2)', borderRadius: 99,
                       margin:'4px auto 14px' }}/>
        <div style={{ padding:'0 22px 14px' }}>
          <span className="k3-h-2" style={{ fontSize: 20 }}>Menü</span>
        </div>
        {items.map((it, i) => (
          <button key={i} onClick={()=>go(it.s)} style={{
            display:'flex', alignItems:'center', gap: 12, width:'100%', textAlign:'left',
            padding:'12px 22px', background:'transparent', border:'none', cursor:'pointer',
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12,
              background:`color-mix(in oklab, ${it.c} 14%, white)`,
              color: it.c, display:'flex', alignItems:'center', justifyContent:'center',
            }}>{it.ic}</span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'block', font:'700 15px var(--k-font-sans)', color:'var(--k3-ink)', letterSpacing:'-0.005em' }}>{it.l}</span>
              <span style={{ display:'block', font:'500 12px var(--k-font-mono)', color:'var(--k3-ink-3)', marginTop: 1 }}>{it.h}</span>
            </span>
            {it.b && (
              <span style={{
                background:'var(--k3-warm-500)', color:'#fff', font:'700 10px var(--k-font-mono)',
                padding:'2px 7px', borderRadius: 99,
              }}>{it.b}</span>
            )}
            <Icons.chevronRight size={16} style={{ color:'var(--k3-ink-3)' }}/>
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileShellV3 = ({ screen, setScreen, openCreate, data, children }) => {
  const [more, setMore] = useSh3(false);
  const titleMap = {
    home: null, discover: 'Keşfet', detail: null,
    notif: 'Bildirimler', leader: 'Liderlik', profile: null,
    messages: 'Mesajlar', archive: 'Arşiv', saved: 'Kaydettiklerim', settings: 'Ayarlar',
  };
  const backTo = ['messages','archive','saved','settings','notif'].includes(screen) ? 'profile' : 'home';
  const title = titleMap[screen];
  const isHome = screen === 'home';

  return (
    <div style={{
      display:'flex', flexDirection:'column', background:'var(--k3-bg)',
      minHeight:'100%', position:'relative',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      <header style={{
        position:'sticky', top: 0, zIndex: 10,
        background:'rgba(244,246,250,0.94)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderBottom:'1px solid var(--k3-rule)',
        padding:'10px 14px', display:'flex', alignItems:'center', gap: 10, minHeight: 56,
      }}>
        {isHome ? (
          <KapisioLogo size={26}/>
        ) : (
          <>
            <button onClick={()=>setScreen(backTo)} style={{
              background:'var(--k3-surface)', border:'1px solid var(--k3-rule)', borderRadius: 12,
              width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'var(--k3-ink)',
            }}>
              <Icons.chevronRight size={17} style={{ transform:'rotate(180deg)' }}/>
            </button>
            <h1 className="k3-h-2" style={{ margin:0, fontSize: 17 }}>{title || 'Kapisio'}</h1>
          </>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
          <button style={{
            background:'var(--k3-surface)', border:'1px solid var(--k3-rule)', borderRadius: 12,
            width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--k3-ink)',
          }}><Icons.search size={17}/></button>
          <button onClick={()=>setScreen('notif')} style={{
            background:'var(--k3-surface)', border:'1px solid var(--k3-rule)', borderRadius: 12,
            width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--k3-ink)', position:'relative',
          }}>
            <Icons.bell size={17}/>
            <span style={{
              position:'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius:'50%',
              background:'var(--k3-warm-500)', border:'1.5px solid #fff',
            }}/>
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding:'14px 14px 96px', overflowY:'auto' }}>
        {children}
      </div>

      <nav style={{
        position:'sticky', bottom: 0, height: 68,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderTop:'1px solid var(--k3-rule)',
        display:'flex', alignItems:'center', justifyContent:'space-around',
        padding:'0 4px', zIndex: 10,
      }}>
        <M3Tab icon={<Icons.home size={20}/>}    label="Anasayfa" active={screen==='home'}     onClick={()=>setScreen('home')}/>
        <M3Tab icon={<Icons.compass size={20}/>} label="Keşfet"   active={screen==='discover'} onClick={()=>setScreen('discover')}/>
        <M3Tab primary onClick={openCreate}/>
        <M3Tab icon={<Icons.trophy size={20}/>}  label="Liderlik" active={screen==='leader'}   onClick={()=>setScreen('leader')}/>
        <M3Tab icon={<Icons.user size={20}/>}    label="Profil"
                  active={['profile','messages','archive','saved','settings','notif'].includes(screen)}
                  badge={9}
                  onClick={()=>setMore(true)}/>
      </nav>
      <M3MoreSheet open={more} onClose={()=>setMore(false)} setScreen={setScreen} data={data}/>
    </div>
  );
};

Object.assign(window, { DesktopShellV3, MobileShellV3 });
