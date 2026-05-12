// Kapisio — Desktop shell (sidebar + main + right rail)

const { useState: useStateD } = React;

const DesktopNavItem = ({ icon, label, active, badge, onClick }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap: 12, width: '100%',
    padding: '10px 14px', borderRadius: 'var(--k-r-md)',
    background: active ? 'var(--k-blue-50)' : 'transparent',
    color: active ? 'var(--k-blue-700)' : 'var(--k-text)',
    border:'none', cursor:'pointer', font: `${active?600:500} 14.5px var(--k-font-sans)`,
    transition:'background .12s, color .12s', position:'relative',
  }}>
    <span style={{ color: active ? 'var(--k-blue-600)' : 'var(--k-text-2)' }}>{icon}</span>
    <span style={{ flex:1, textAlign:'left' }}>{label}</span>
    {badge && (
      <span style={{
        background:'var(--k-coral-500)', color:'#fff', font:'700 10px var(--k-font-mono)',
        padding:'2px 6px', borderRadius: 99, minWidth: 18, textAlign:'center',
      }}>{badge}</span>
    )}
  </button>
);

const DesktopShell = ({ screen, setScreen, openCreate, data, children }) => {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'260px 1fr 320px',
      minHeight:'100%', background:'var(--k-bg)',
    }}>
      {/* LEFT SIDEBAR */}
      <aside style={{
        borderRight:'1px solid var(--k-border)', background:'var(--k-bg-elev)',
        padding:'18px 14px', display:'flex', flexDirection:'column', gap: 4, position:'sticky', top:0, height:'100vh',
      }}>
        <div style={{ padding:'4px 8px 14px' }}>
          <KapisioLogo size={28}/>
        </div>
        <DesktopNavItem icon={<Icons.home size={20}/>}     label="Anasayfa"     active={screen==='home'}     onClick={()=>setScreen('home')}/>
        <DesktopNavItem icon={<Icons.compass size={20}/>}  label="Keşfet"       active={screen==='discover'} onClick={()=>setScreen('discover')}/>
        <DesktopNavItem icon={<Icons.bell size={20}/>}     label="Bildirimler"  active={screen==='notif'}    badge="6" onClick={()=>setScreen('notif')}/>
        <DesktopNavItem icon={<Icons.msg size={20}/>}      label="Mesajlar"     active={screen==='messages'} badge="3" onClick={()=>setScreen('messages')}/>
        <DesktopNavItem icon={<Icons.trophy size={20}/>}   label="Liderlik"     active={screen==='leader'}   onClick={()=>setScreen('leader')}/>
        <DesktopNavItem icon={<Icons.archive size={20}/>}  label="Arşiv"        active={screen==='archive'}  onClick={()=>setScreen('archive')}/>
        <DesktopNavItem icon={<Icons.bookmark size={20}/>} label="Kaydettiklerim" active={screen==='saved'}  onClick={()=>setScreen('saved')}/>
        <DesktopNavItem icon={<Icons.user size={20}/>}     label="Profil"       active={screen==='profile'}  onClick={()=>setScreen('profile')}/>
        <DesktopNavItem icon={<Icons.settings size={20}/>} label="Ayarlar"      active={screen==='settings'} onClick={()=>setScreen('settings')}/>

        <button className="k-btn k-btn-primary" onClick={openCreate} style={{
          height: 44, marginTop: 14, fontSize: 14.5, width:'100%',
        }}>
          <Icons.plus size={18}/> Senaryo Oluştur
        </button>

        {/* Streak card */}
        <div style={{
          marginTop:'auto', padding: 12,
          background:'linear-gradient(135deg, var(--k-coral-500), var(--k-coral-600))',
          color:'#fff', borderRadius:'var(--k-r-md)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
            <Icons.flame size={18}/>
            <span style={{ font:'700 14px var(--k-font-sans)' }}>{data.user.streak} günlük seri</span>
          </div>
          <div style={{ font:'400 12px var(--k-font-sans)', opacity:.9 }}>
            Bugünkü senaryoyu cevapla, seri korunsun.
          </div>
        </div>

        {/* User chip */}
        <div style={{
          display:'flex', alignItems:'center', gap: 10, padding: 10,
          borderRadius:'var(--k-r-md)', cursor:'pointer',
          border:'1px solid var(--k-border)',
        }} onClick={()=>setScreen('profile')}>
          <Avatar name={data.user.avatar} color={data.user.avatarColor} size={36}/>
          <div style={{ flex:1, minWidth: 0 }}>
            <div style={{ font:'600 13.5px var(--k-font-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{data.user.name}</div>
            <div style={{ font:'400 11.5px var(--k-font-mono)', color:'var(--k-text-3)' }}>@{data.user.handle}</div>
          </div>
          <Icons.more size={16} style={{ color:'var(--k-text-3)' }}/>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          position:'sticky', top:0, zIndex: 5, background:'rgba(247,248,250,0.85)',
          backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
          borderBottom:'1px solid var(--k-border)',
          padding:'10px 24px', display:'flex', alignItems:'center', gap: 12,
        }}>
          <h1 style={{ margin:0, font:'700 18px var(--k-font-sans)', letterSpacing:'-0.01em' }}>
            {screen === 'home' && 'Anasayfa'}
            {screen === 'discover' && 'Keşfet'}
            {screen === 'detail' && 'Günün Senaryosu'}
            {screen === 'notif' && 'Bildirimler'}
            {screen === 'leader' && 'Liderlik'}
            {screen === 'profile' && 'Profil'}
          </h1>
          <div style={{ flex:1, maxWidth: 360, marginLeft: 14, position:'relative' }}>
            <Icons.search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--k-text-3)' }}/>
            <input placeholder="Ara…" style={{
              width:'100%', height: 36, paddingLeft: 36, paddingRight: 12,
              font:'400 13.5px var(--k-font-sans)',
              border:'1px solid var(--k-border)', borderRadius:'var(--k-r-pill)',
              background:'var(--k-bg-elev)', color:'var(--k-text)', outline:'none',
            }}/>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap: 4 }}>
            <button className="k-btn k-btn-ghost" style={{ height: 36, padding:'0 10px' }}><Icons.moon size={18}/></button>
            <button className="k-btn k-btn-ghost" style={{ height: 36, padding:'0 10px' }}><Icons.shield size={18}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 24px 40px', maxWidth: 760, margin:'0 auto' }}>
          {children}
        </div>
      </main>

      {/* RIGHT RAIL */}
      <aside style={{
        borderLeft:'1px solid var(--k-border)', background:'var(--k-bg-elev)',
        padding:'18px 16px', display:'flex', flexDirection:'column', gap: 16,
        position:'sticky', top:0, height:'100vh', overflowY:'auto',
      }}>
        {/* Trending */}
        <div>
          <SectionTitle action={<Icons.flame size={14} style={{color:'var(--k-coral-500)'}}/>}>Trend Etiketler</SectionTitle>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {data.trendingTopics.map(t => (
              <button key={t.tag} style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 10px', borderRadius:'var(--k-r-pill)',
                background:'var(--k-bg-soft)', color:'var(--k-text-2)',
                border:'none', cursor:'pointer', font:'500 12.5px var(--k-font-sans)',
              }}>
                <span style={{ color:'var(--k-blue-500)' }}>{t.tag}</span>
                <span style={{ color:'var(--k-text-3)', font:'500 11px var(--k-font-mono)' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard mini */}
        <div>
          <SectionTitle action={<button onClick={()=>setScreen('leader')} className="k-btn k-btn-ghost" style={{ fontSize:11, height:22, padding:'0 6px', color:'var(--k-blue-500)' }}>Tümü →</button>}>Bu Hafta · Liderler</SectionTitle>
          <div className="k-card" style={{ overflow:'hidden' }}>
            {data.leaderboard.slice(0, 4).map((u, i) => (
              <div key={u.handle} style={{
                display:'flex', alignItems:'center', gap: 10, padding:'10px 12px',
                borderBottom: i === 3 ? 'none' : '1px solid var(--k-border)',
              }}>
                <span style={{
                  width: 20, font:'700 12px var(--k-font-mono)', textAlign:'center',
                  color: u.rank <= 3 ? 'var(--k-coral-500)' : 'var(--k-text-3)',
                }}>{u.rank}</span>
                <Avatar name={u.avatar} color={u.color} size={28}/>
                <div style={{ flex:1, minWidth: 0 }}>
                  <div style={{ font:'600 13px var(--k-font-sans)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name} {u.badge}</div>
                </div>
                <div style={{ font:'600 12px var(--k-font-mono)', color:'var(--k-text-2)' }}>{(u.points/1000).toFixed(1)}k</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tanıyor olabilirsin */}
        <div>
          <SectionTitle>Tanıyor Olabilirsin</SectionTitle>
          <div className="k-card" style={{ padding: 8, display:'flex', flexDirection:'column', gap: 4 }}>
            {[
              { n:'Ela H.',  h:'elahas', a:'E', c:'#1f8df0', b:'🏆' },
              { n:'Cesur',   h:'cesurr', a:'C', c:'#1c2f6e', b:'⚔️' },
              { n:'Lara K.', h:'larak',  a:'L', c:'#2a6cf0', b:'⚔️' },
            ].map(u => (
              <div key={u.h} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px' }}>
                <Avatar name={u.a} color={u.c} size={36}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ font:'600 13px var(--k-font-sans)', display:'flex', alignItems:'center', gap:4 }}>{u.n} <span style={{ fontSize:11 }}>{u.b}</span></div>
                  <div style={{ font:'400 11.5px var(--k-font-mono)', color:'var(--k-text-3)' }}>@{u.h}</div>
                </div>
                <button className="k-btn k-btn-outline" style={{ height: 28, padding:'0 10px', fontSize:12 }}>Takip Et</button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

window.DesktopShell = DesktopShell;
