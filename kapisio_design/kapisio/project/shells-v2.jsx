// Kapisio v2 — Desktop and Mobile shells (editorial)

const { useState: useSh } = React;

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP
// ─────────────────────────────────────────────────────────────────────────────
const DSidebarItem = ({ icon, label, hint, active, badge, onClick }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap: 12, width:'100%',
    padding:'10px 12px', borderRadius: 10,
    background: active ? 'var(--k2-paper-2)' : 'transparent',
    color: active ? 'var(--k2-ink)' : 'var(--k2-ink-2)',
    border:'none', cursor:'pointer', textAlign:'left',
    transition:'background .12s',
  }}>
    <span style={{
      width: 32, height: 32, borderRadius: 8,
      background: active ? '#fff' : 'transparent',
      border: active ? '1px solid var(--k2-rule)' : '1px solid transparent',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      color: active ? 'var(--k2-ink)' : 'var(--k2-ink-3)',
    }}>{icon}</span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display:'block', font:`${active?600:500} 14px var(--k2-sans)` }}>{label}</span>
      {hint && (
        <span style={{ display:'block', font:'400 11.5px var(--k2-mono)', color:'var(--k2-ink-3)', marginTop: 1 }}>{hint}</span>
      )}
    </span>
    {badge && (
      <span style={{
        background:'var(--k2-warm-500)', color:'#fff', font:'700 10px var(--k2-mono)',
        padding:'2px 7px', borderRadius: 99, minWidth: 18, textAlign:'center',
      }}>{badge}</span>
    )}
  </button>
);

const DesktopShellV2 = ({ screen, setScreen, openCreate, data, edition, children }) => {
  const nav = [
    { k:'home',     l:'Anasayfa',    h:'Günün davası',         icon:<Icons.home size={17}/> },
    { k:'discover', l:'Keşfet',      h:'Bölümler & yükselenler', icon:<Icons.compass size={17}/> },
    { k:'leader',   l:'Liderlik',    h:'Bu hafta',              icon:<Icons.trophy size={17}/> },
    { k:'archive',  l:'Arşiv',       h:'Geçmiş sayılar',        icon:<Icons.archive size={17}/> },
  ];
  const nav2 = [
    { k:'notif',    l:'Bildirimler', icon:<Icons.bell size={17}/>, b: 6 },
    { k:'messages', l:'Mesajlar',    icon:<Icons.msg size={17}/>,  b: 3 },
    { k:'saved',    l:'Kaydettiklerim', icon:<Icons.bookmark size={17}/> },
    { k:'profile',  l:'Profil',      icon:<Icons.user size={17}/> },
    { k:'settings', l:'Ayarlar',     icon:<Icons.settings size={17}/> },
  ];

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'278px 1fr 320px',
      minHeight:'100%', background:'var(--k2-paper)',
    }}>
      {/* LEFT SIDEBAR */}
      <aside style={{
        borderRight:'1px solid var(--k2-rule)', background:'#fff',
        padding:'18px 14px', display:'flex', flexDirection:'column', gap: 4,
        position:'sticky', top: 0, height:'100vh',
      }}>
        {/* Brand */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'4px 6px 16px', borderBottom:'1px solid var(--k2-rule)', marginBottom: 10,
        }}>
          <KapisioLogo size={26}/>
          <span className="k2-eyebrow k2-tab" style={{ color:'var(--k2-ink-3)' }}>№ {edition}</span>
        </div>

        <div className="k2-eyebrow" style={{ padding:'4px 12px 6px' }}>Kapısma</div>
        {nav.map(n => (
          <DSidebarItem key={n.k} icon={n.icon} label={n.l} hint={n.h}
                        active={screen===n.k} onClick={()=>setScreen(n.k)}/>
        ))}

        <button className="k2-btn k2-btn-ink" onClick={openCreate} style={{
          height: 44, marginTop: 14, width:'100%', fontSize: 14, fontWeight: 600,
        }}>
          <Icons.plus size={16}/> Senaryo Oluştur
        </button>

        <div className="k2-eyebrow" style={{ padding:'18px 12px 6px' }}>Sen</div>
        {nav2.map(n => (
          <DSidebarItem key={n.k} icon={n.icon} label={n.l} badge={n.b}
                        active={screen===n.k} onClick={()=>setScreen(n.k)}/>
        ))}

        {/* Streak chip */}
        <div style={{
          marginTop:'auto', padding: 14, borderRadius: 12,
          background:'linear-gradient(135deg, var(--k2-warm-50), var(--k2-warm-100))',
          border:'1px solid var(--k2-warm-200)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <Icons.flame size={20} style={{ color:'var(--k2-warm-600)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ font:'700 14px var(--k2-sans)', color:'var(--k2-warm-700)' }}>
                {data.user.streak} günlük seri
              </div>
              <div style={{ font:'400 11px var(--k2-mono)', color:'var(--k2-warm-700)', opacity:.75 }}>
                Bugünkü senaryoyu cevapla, kopma.
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap: 4, marginTop: 10 }}>
            {[1,1,1,1,0,0,0].map((d,i)=>(
              <span key={i} style={{
                flex:1, height: 4, borderRadius: 99,
                background: d ? 'var(--k2-warm-500)' : 'rgba(184,82,14,0.2)',
              }}/>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ minWidth: 0 }}>
        <div style={{
          position:'sticky', top: 0, zIndex: 5,
          background:'rgba(250,247,242,0.85)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          borderBottom:'1px solid var(--k2-rule)',
          padding:'14px 28px', display:'flex', alignItems:'center', gap: 14,
        }}>
          <div style={{ display:'flex', alignItems:'baseline', gap: 10 }}>
            <h1 className="k2-display" style={{
              margin:0, font:'500 24px var(--k2-display)', letterSpacing:'-0.01em',
            }}>
              {{
                home: 'Anasayfa', discover: 'Keşfet', detail: 'Günün Davası',
                notif: 'Bildirimler', leader: 'Liderlik', profile: 'Profil',
                messages: 'Mesajlar', archive: 'Arşiv', saved: 'Kaydettiklerim', settings: 'Ayarlar',
              }[screen] || 'Kapisio'}
            </h1>
            <span className="k2-eyebrow" style={{ color:'var(--k2-ink-3)' }}>
              {screen === 'home' && '11 Mayıs 2026 · Pazartesi'}
              {screen === 'discover' && 'Bölümler · trend · editör seçimleri'}
              {screen === 'leader' && 'Bu hafta · canlı'}
              {screen === 'detail' && 'Pazar günü aile ziyaretinde…'}
            </span>
          </div>
          <div style={{ flex: 1, maxWidth: 320, marginLeft: 'auto', position:'relative' }}>
            <Icons.search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--k2-ink-3)' }}/>
            <input placeholder="Ara…" style={{
              width:'100%', height: 36, paddingLeft: 36, paddingRight: 14,
              font:'400 13px var(--k2-sans)',
              border:'1px solid var(--k2-rule)', borderRadius: 999,
              background:'#fff', color:'var(--k2-ink)', outline:'none',
            }}/>
          </div>
          <button onClick={()=>setScreen('notif')} className="k2-btn k2-btn-paper" style={{ height: 36, width: 36, padding: 0, position:'relative' }}>
            <Icons.bell size={16}/>
            <span style={{
              position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%',
              background:'var(--k2-warm-500)', border:'1.5px solid #fff',
            }}/>
          </button>
          <Avatar name={data.user.avatar} color={data.user.avatarColor} size={36}/>
        </div>

        <div style={{ padding:'24px 28px 60px', maxWidth: 820, margin:'0 auto' }}>
          {children}
        </div>
      </main>

      {/* RIGHT RAIL */}
      <aside style={{
        borderLeft:'1px solid var(--k2-rule)', background:'#fff',
        padding:'18px 18px', display:'flex', flexDirection:'column', gap: 20,
        position:'sticky', top: 0, height:'100vh', overflowY:'auto',
      }}>
        {/* Today's pulse */}
        <div>
          <div className="k2-eyebrow" style={{ marginBottom: 10 }}>Bugün · canlı nabız</div>
          <div className="k2-card" style={{ padding: 14, background:'var(--k2-paper)' }}>
            <TugBar warm={38} cool={62}/>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 12,
                            font:'500 11px var(--k2-mono)', color:'var(--k2-ink-3)' }} className="k2-tab">
              <span>247 cevap</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--k2-warm-500)' }}/>
                12 aktif düello
              </span>
            </div>
          </div>
        </div>

        {/* Trending tags */}
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k2-eyebrow">Trend etiketler</span>
            <Icons.flame size={12} style={{ color:'var(--k2-warm-500)' }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            {data.trendingTopics.map((t,i)=>(
              <button key={t.tag} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 12px', background:'transparent', border:'none',
                borderRadius: 8, cursor:'pointer', textAlign:'left',
                borderBottom: i === data.trendingTopics.length-1 ? 'none' : '1px solid var(--k2-rule-soft)',
              }}>
                <div>
                  <div className="k2-eyebrow" style={{ color:'var(--k2-ink-3)' }}>0{i+1} · trend</div>
                  <div style={{ font:'600 14px var(--k2-sans)', color:'var(--k2-cool-700)', marginTop: 3 }}>{t.tag}</div>
                </div>
                <div className="k2-tab" style={{ font:'500 11px var(--k2-mono)', color:'var(--k2-ink-3)' }}>
                  {t.count}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mini leaderboard */}
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
            <span className="k2-eyebrow">Bu hafta · liderler</span>
            <button onClick={()=>setScreen('leader')} style={{
              background:'none', border:'none', color:'var(--k2-cool-700)',
              font:'500 11px var(--k2-sans)', cursor:'pointer',
            }}>Tümü →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            {data.leaderboard.slice(0, 4).map((u, i) => (
              <div key={u.handle} style={{
                display:'flex', alignItems:'center', gap: 10, padding:'8px 4px',
                borderBottom: i === 3 ? 'none' : '1px solid var(--k2-rule-soft)',
              }}>
                <span style={{
                  width: 20, font:`${u.rank<=3?700:500} 12px var(--k2-display)`, textAlign:'center',
                  color: u.rank===1?'#d97706':u.rank===2?'#6b7280':u.rank===3?'#b45309':'var(--k2-ink-3)',
                }}>{u.rank}</span>
                <Avatar name={u.avatar} color={u.color} size={28}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font:'600 13px var(--k2-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.name}
                  </div>
                </div>
                <div className="k2-tab" style={{ font:'600 11.5px var(--k2-mono)', color:'var(--k2-ink-2)' }}>
                  {(u.points/1000).toFixed(1)}k
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ font:'500 10.5px var(--k2-mono)', color:'var(--k2-ink-3)', letterSpacing:'0.04em',
                       paddingTop: 12, borderTop:'1px solid var(--k2-rule)', textAlign:'center' }}>
          KAPISIO · v2 · TÜRKİYE'NİN GÜNLÜK MEYDANI
        </div>
      </aside>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE
// ─────────────────────────────────────────────────────────────────────────────
const MTabItem = ({ icon, label, active, onClick, badge, primary }) => {
  if (primary) {
    return (
      <button onClick={onClick} style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width: 54, height: 54, borderRadius: 16,
        background: 'var(--k2-ink)', color:'#fff', border:'none', cursor:'pointer',
        boxShadow:'0 6px 18px rgba(12,16,24,0.25)',
        transform:'translateY(-12px)',
      }}><Icons.plus size={22}/></button>
    );
  }
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 3,
      background:'transparent', border:'none', cursor:'pointer',
      color: active ? 'var(--k2-ink)' : 'var(--k2-ink-3)',
      flex: 1, height:'100%', position:'relative',
    }}>
      <span style={{ position:'relative',
                       padding: active ? '4px 12px' : 0,
                       background: active ? 'var(--k2-paper-2)' : 'transparent',
                       borderRadius: 99, transition:'background .12s, padding .12s' }}>
        {icon}
        {badge && (
          <span style={{
            position:'absolute', top:-2, right: active? 4 : -7, minWidth: 14, height: 14, padding:'0 3px',
            background:'var(--k2-warm-500)', color:'#fff', borderRadius: 99,
            font:'700 9px var(--k2-mono)', display:'flex', alignItems:'center', justifyContent:'center',
            border:'1.5px solid var(--k2-paper)',
          }}>{badge}</span>
        )}
      </span>
      <span style={{ font:`${active?600:500} 10px var(--k2-sans)` }}>{label}</span>
    </button>
  );
};

const MMoreSheet = ({ open, onClose, setScreen, data, edition }) => {
  if (!open) return null;
  const go = (s) => { setScreen(s); onClose(); };
  const items = [
    { ic:<Icons.bell size={18}/>,    l:'Bildirimler',  h:'6 yeni',  s:'notif',   b:6, c:'var(--k2-warm-500)' },
    { ic:<Icons.msg size={18}/>,     l:'Mesajlar',     h:'3 yeni',  s:'messages',b:3, c:'var(--k2-cool-500)' },
    { ic:<Icons.trophy size={18}/>,  l:'Liderlik',     h:'Bu hafta',s:'leader',  c:'#d97706' },
    { ic:<Icons.archive size={18}/>, l:'Arşiv',        h:'248 sayı',s:'archive', c:'var(--k2-ink-2)' },
    { ic:<Icons.bookmark size={18}/>,l:'Kaydettiklerim',h:'24 öge', s:'saved',   c:'var(--k2-cool-500)' },
    { ic:<Icons.settings size={18}/>,l:'Ayarlar',      h:'Tema · gizlilik', s:'settings', c:'var(--k2-ink-2)' },
  ];
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset: 0, background:'rgba(12,16,24,0.45)', zIndex: 50,
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:'var(--k2-paper)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding:'10px 0 22px', animation:'slideUp .25s ease-out',
      }}>
        <div style={{ width: 38, height: 4, background:'var(--k2-rule-soft)', borderRadius: 99,
                       margin:'4px auto 14px' }}/>
        <div style={{
          padding:'0 22px 14px', display:'flex', alignItems:'baseline', justifyContent:'space-between',
        }}>
          <span className="k2-display" style={{ font:'500 20px var(--k2-display)' }}>Menü</span>
          <span className="k2-eyebrow k2-tab" style={{ color:'var(--k2-ink-3)' }}>№ {edition}</span>
        </div>
        {items.map((it, i) => (
          <button key={i} onClick={()=>go(it.s)} style={{
            display:'flex', alignItems:'center', gap: 12, width:'100%', textAlign:'left',
            padding:'12px 22px', background:'transparent', border:'none', cursor:'pointer',
          }}>
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background:'#fff', border:'1px solid var(--k2-rule)',
              color: it.c, display:'flex', alignItems:'center', justifyContent:'center',
            }}>{it.ic}</span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'block', font:'600 15px var(--k2-sans)', color:'var(--k2-ink)' }}>{it.l}</span>
              <span style={{ display:'block', font:'400 12px var(--k2-mono)', color:'var(--k2-ink-3)', marginTop: 1 }}>{it.h}</span>
            </span>
            {it.b && (
              <span style={{
                background:'var(--k2-warm-500)', color:'#fff', font:'700 10px var(--k2-mono)',
                padding:'2px 7px', borderRadius: 99,
              }}>{it.b}</span>
            )}
            <Icons.chevronRight size={16} style={{ color:'var(--k2-ink-3)' }}/>
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileShellV2 = ({ screen, setScreen, openCreate, data, edition, children }) => {
  const [more, setMore] = useSh(false);
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
      display:'flex', flexDirection:'column', background:'var(--k2-paper)',
      minHeight:'100%', position:'relative',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Top bar */}
      <header style={{
        position:'sticky', top: 0, zIndex: 10,
        background:'rgba(250,247,242,0.94)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderBottom:'1px solid var(--k2-rule)',
        padding:'10px 14px', display:'flex', alignItems:'center', gap: 10, minHeight: 58,
      }}>
        {isHome ? (
          <>
            <KapisioLogo size={26}/>
            <span className="k2-eyebrow k2-tab" style={{
              padding:'4px 9px', background:'var(--k2-paper-2)', borderRadius: 99,
            }}>№ {edition}</span>
          </>
        ) : (
          <>
            <button onClick={()=>setScreen(backTo)} style={{
              background:'#fff', border:'1px solid var(--k2-rule)', borderRadius: 99,
              width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'var(--k2-ink)',
            }}>
              <Icons.chevronRight size={17} style={{ transform:'rotate(180deg)' }}/>
            </button>
            <h1 className="k2-display" style={{ margin:0, font:'500 18px var(--k2-display)' }}>{title || 'Kapisio'}</h1>
          </>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap: 6 }}>
          <button style={{
            background:'#fff', border:'1px solid var(--k2-rule)', borderRadius: 99,
            width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--k2-ink)',
          }}><Icons.search size={17}/></button>
          <button onClick={()=>setScreen('notif')} style={{
            background:'#fff', border:'1px solid var(--k2-rule)', borderRadius: 99,
            width: 36, height: 36, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color:'var(--k2-ink)', position:'relative',
          }}>
            <Icons.bell size={17}/>
            <span style={{
              position:'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius:'50%',
              background:'var(--k2-warm-500)', border:'1.5px solid #fff',
            }}/>
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding:'14px 14px 96px', overflowY:'auto' }}>
        {children}
      </div>

      {/* Bottom tab bar */}
      <nav style={{
        position:'sticky', bottom: 0, height: 68,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderTop:'1px solid var(--k2-rule)',
        display:'flex', alignItems:'center', justifyContent:'space-around',
        padding:'0 4px', zIndex: 10,
      }}>
        <MTabItem icon={<Icons.home size={20}/>}    label="Anasayfa" active={screen==='home'}     onClick={()=>setScreen('home')}/>
        <MTabItem icon={<Icons.compass size={20}/>} label="Keşfet"   active={screen==='discover'} onClick={()=>setScreen('discover')}/>
        <MTabItem primary onClick={openCreate}/>
        <MTabItem icon={<Icons.trophy size={20}/>}  label="Liderlik" active={screen==='leader'}   onClick={()=>setScreen('leader')}/>
        <MTabItem icon={<Icons.more size={20}/>}    label="Menü"
                  active={['messages','archive','saved','settings','notif','profile'].includes(screen)}
                  badge={9}
                  onClick={()=>setMore(true)}/>
      </nav>
      <MMoreSheet open={more} onClose={()=>setMore(false)} setScreen={setScreen} data={data} edition={edition}/>
    </div>
  );
};

Object.assign(window, { DesktopShellV2, MobileShellV2 });
