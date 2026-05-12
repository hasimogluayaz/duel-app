// Kapisio — Mobile shell (top bar + content + bottom tabs + FAB)

const { useState: useStateM } = React;

const MobileTabItem = ({ icon, label, active, badge, onClick, primary }) => {
  if (primary) {
    return (
      <button onClick={onClick} style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width: 52, height: 52, borderRadius: 16,
        background: 'linear-gradient(135deg, var(--k-blue-400), var(--k-blue-600))',
        color: '#fff', border:'none', cursor:'pointer',
        boxShadow:'0 6px 16px rgba(42,108,240,0.35)',
        transform:'translateY(-14px)',
      }}>
        <Icons.plus size={24}/>
      </button>
    );
  }
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 3,
      background:'transparent', border:'none', cursor:'pointer',
      color: active ? 'var(--k-blue-500)' : 'var(--k-text-3)',
      flex: 1, height: '100%', position:'relative',
    }}>
      <span style={{ position:'relative' }}>
        {icon}
        {badge && (
          <span style={{
            position:'absolute', top:-4, right:-7, minWidth: 14, height: 14, padding:'0 3px',
            background:'var(--k-coral-500)', color:'#fff', borderRadius: 99,
            font:'700 9px var(--k-font-mono)', display:'flex', alignItems:'center', justifyContent:'center',
            border:'1.5px solid var(--k-bg-elev)',
          }}>{badge}</span>
        )}
      </span>
      <span style={{ font: `${active?600:500} 10px var(--k-font-sans)`, letterSpacing:'.01em' }}>{label}</span>
    </button>
  );
};

const MoreSheet = ({ open, onClose, setScreen }) => {
  if (!open) return null;
  const go = (s) => { setScreen(s); onClose(); };
  const items = [
    { icon:<Icons.msg size={18}/>,      label:'Mesajlar',     hint:'3 yeni mesaj',         screen:'messages', badge:3, c:'var(--k-blue-500)' },
    { icon:<Icons.archive size={18}/>,  label:'Arşiv',        hint:'Geçmiş senaryolar',    screen:'archive',  c:'var(--k-text-2)' },
    { icon:<Icons.bookmark size={18}/>, label:'Kaydettiklerim', hint:'24 öge',             screen:'saved',    c:'var(--k-coral-500)' },
    { icon:<Icons.trophy size={18}/>,   label:'Liderlik',     hint:'Bu hafta sen #142',    screen:'leader',   c:'var(--k-sky-500)' },
    { icon:<Icons.user size={18}/>,     label:'Profil',       hint:'@hasimogluayaz',       screen:'profile',  c:'var(--k-text-2)' },
    { icon:<Icons.settings size={18}/>, label:'Ayarlar',      hint:'Tema · bildirim · gizlilik', screen:'settings', c:'var(--k-text-2)' },
  ];
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset: 0, background:'rgba(15,19,32,0.45)', zIndex: 50,
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:'var(--k-bg-elev)', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding:'10px 0 18px', borderTop:'1px solid var(--k-border)',
        animation:'slideUp .25s ease-out',
      }}>
        <div style={{ width: 38, height: 4, background:'var(--k-border-strong)', borderRadius: 99,
                      margin:'4px auto 12px' }}/>
        <div style={{ padding:'0 18px 6px', font:'700 11px var(--k-font-sans)',
                       color:'var(--k-text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>
          Menü
        </div>
        {items.map((it, i) => (
          <button key={i} onClick={()=>go(it.screen)} style={{
            display:'flex', alignItems:'center', gap: 12, width:'100%', textAlign:'left',
            padding:'12px 18px', background:'transparent', border:'none', cursor:'pointer',
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background:`color-mix(in oklab, ${it.c} 12%, white)`, color: it.c,
              display:'flex', alignItems:'center', justifyContent:'center', flex:'none',
            }}>{it.icon}</span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'block', font:'600 14.5px var(--k-font-sans)', color:'var(--k-text)' }}>{it.label}</span>
              <span style={{ display:'block', font:'400 12px var(--k-font-sans)', color:'var(--k-text-3)', marginTop: 1 }}>{it.hint}</span>
            </span>
            {it.badge && (
              <span style={{
                background:'var(--k-coral-500)', color:'#fff', font:'700 10px var(--k-font-mono)',
                padding:'2px 7px', borderRadius: 99,
              }}>{it.badge}</span>
            )}
            <Icons.chevronRight size={16} style={{ color:'var(--k-text-3)' }}/>
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileShell = ({ screen, setScreen, openCreate, data, children }) => {
  const [more, setMore] = useStateM(false);
  const titleMap = {
    home: null, discover: 'Keşfet', detail: null,
    notif: 'Bildirimler', leader: 'Liderlik', profile: null,
    messages: 'Mesajlar', archive: 'Arşiv', saved: 'Kaydettiklerim', settings: 'Ayarlar',
  };
  const backTo = ['messages','archive','saved','settings','notif'].includes(screen) ? 'profile' : 'home';
  const title = titleMap[screen];
  return (
    <div style={{
      display:'flex', flexDirection:'column', background:'var(--k-bg)',
      minHeight: '100%', position: 'relative',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      {/* Top bar */}
      <header style={{
        position:'sticky', top: 0, zIndex: 10, background:'rgba(247,248,250,0.92)',
        backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
        borderBottom:'1px solid var(--k-border)',
        padding:'10px 14px', display:'flex', alignItems:'center', gap: 10, height: 54,
      }}>
        {screen === 'home' ? (
          <KapisioLogo size={26}/>
        ) : (
          <>
            <button onClick={()=>setScreen(backTo)} style={{
              background:'none', border:'none', cursor:'pointer', padding: 4, color:'var(--k-text)',
              display:'flex', alignItems:'center',
            }}>
              <Icons.chevronRight size={20} style={{ transform:'rotate(180deg)' }}/>
            </button>
            <h1 style={{ margin:0, font:'700 16px var(--k-font-sans)', letterSpacing:'-0.01em' }}>{title || 'Kapisio'}</h1>
          </>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap: 2 }}>
          <button className="k-btn k-btn-ghost" style={{ width: 38, height: 38, padding:0, borderRadius: 99 }}>
            <Icons.search size={19}/>
          </button>
          <button className="k-btn k-btn-ghost" style={{ width: 38, height: 38, padding:0, borderRadius: 99, position:'relative' }}
                  onClick={()=>setScreen('messages')}>
            <Icons.msg size={19}/>
            <span style={{
              position:'absolute', top: 6, right: 6, minWidth: 14, height: 14, padding:'0 3px',
              background:'var(--k-coral-500)', color:'#fff', borderRadius: 99,
              font:'700 9px var(--k-font-mono)', display:'flex', alignItems:'center', justifyContent:'center',
              border:'1.5px solid var(--k-bg-elev)',
            }}>3</span>
          </button>
          <button className="k-btn k-btn-ghost" style={{ width: 38, height: 38, padding:0, borderRadius: 99, position:'relative' }}
                  onClick={()=>setScreen('notif')}>
            <Icons.bell size={19}/>
            <span style={{
              position:'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius:'50%',
              background:'var(--k-coral-500)', border:'1.5px solid var(--k-bg-elev)',
            }}/>
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 14px 90px', overflowY:'auto' }}>
        {children}
      </div>

      {/* Bottom tab bar */}
      <nav style={{
        position:'sticky', bottom: 0, height: 64,
        background:'var(--k-bg-elev)',
        borderTop:'1px solid var(--k-border)',
        display:'flex', alignItems:'center', justifyContent:'space-around',
        padding:'0 4px', zIndex: 10,
        boxShadow:'0 -2px 12px rgba(15,19,32,0.04)',
      }}>
        <MobileTabItem icon={<Icons.home size={22}/>}     label="Anasayfa" active={screen==='home'}     onClick={()=>setScreen('home')}/>
        <MobileTabItem icon={<Icons.compass size={22}/>}  label="Keşfet"   active={screen==='discover'} onClick={()=>setScreen('discover')}/>
        <MobileTabItem primary onClick={openCreate}/>
        <MobileTabItem icon={<Icons.user size={22}/>}     label="Profil"   active={screen==='profile'}  onClick={()=>setScreen('profile')}/>
        <MobileTabItem icon={<Icons.more size={22}/>}     label="Daha"
                       active={['messages','archive','saved','settings','leader'].includes(screen)}
                       onClick={()=>setMore(true)}/>
      </nav>
      <MoreSheet open={more} onClose={()=>setMore(false)} setScreen={setScreen}/>
    </div>
  );
};

window.MobileShell = MobileShell;
