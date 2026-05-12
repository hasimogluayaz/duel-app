// Kapisio — extra screens (Mesajlar, Arşiv, Kaydettiklerim, Ayarlar)

const { useState: useStateX } = React;

// ─────────────────────────────────────────────────────────────────────────────
// MESAJLAR — Messages (DM list + active thread)
// ─────────────────────────────────────────────────────────────────────────────
const MESSAGES_DATA = {
  threads: [
    { id:'t1', name:'Ela Hasımoglu', handle:'elahas', avatar:'E', color:'#1f8df0',
      preview:'sen gerçekten soğuk diyebildin mi? :)', time:'14d', unread: 2, online: true,
      duel: 'Bekleyen düello çağrısı' },
    { id:'t2', name:'Mert Y.', handle:'mertyy', avatar:'M', color:'#2a6cf0',
      preview:'cevabını gördüm, hak verdim aslında', time:'1s', unread: 0, online: true },
    { id:'t3', name:'Cesur', handle:'cesurr', avatar:'C', color:'#1c2f6e',
      preview:'oylama bitti, sonucu gördün mü?', time:'2s', unread: 0, online: false },
    { id:'t4', name:'Zeynep Ak', handle:'zeynepak', avatar:'Z', color:'#1442a8',
      preview:'şampiyon olarak söylüyorum: bu senaryo zor', time:'1g', unread: 1, online: false },
    { id:'t5', name:'Lara K.', handle:'larak', avatar:'L', color:'#2a6cf0',
      preview:'sen yazınca trend olur 😂', time:'2g', unread: 0, online: true },
    { id:'t6', name:'Burak Demir', handle:'burakd', avatar:'B', color:'#4aa8ff',
      preview:'düello karşı tarafa geçti, oyunda mısın?', time:'3g', unread: 0, online: false },
  ],
  active: 't1',
  messages: {
    t1: [
      { from:'them', t:'düelloyu kabul edecek misin? cevabın komikti :)', time:'14:02' },
      { from:'me',   t:'tabii edicem, ama önce kendi cevabını yaz', time:'14:04' },
      { from:'them', t:'yazdım, oylamaya açtım. soğuğa karşı sıcağı savunuyorum', time:'14:05', side:'sicak' },
      { from:'them', t:'sen gerçekten soğuk diyebildin mi? :)', time:'14:08' },
    ],
  },
};

const MessagesScreen = ({ vp }) => {
  const [active, setActive] = useStateX(MESSAGES_DATA.active);
  const [view, setView] = useStateX('list'); // 'list' | 'thread' — mobile only
  const isMobile = vp === 'mobile';
  const thread = MESSAGES_DATA.threads.find(t => t.id === active);
  const msgs = MESSAGES_DATA.messages[active] || MESSAGES_DATA.messages.t1;

  const ThreadList = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'14px 14px 10px', display:'flex', flexDirection:'column', gap: 10,
                    borderBottom:'1px solid var(--k-border)' }}>
        <h2 style={{ margin:0, font:'700 18px var(--k-font-sans)', letterSpacing:'-0.01em',
                     display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          Mesajlar
          <button className="k-btn k-btn-ghost" style={{ height: 30, width: 30, padding: 0, borderRadius: 99 }}>
            <Icons.plus size={18}/>
          </button>
        </h2>
        <div style={{ position:'relative' }}>
          <Icons.search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--k-text-3)' }}/>
          <input placeholder="Konuşma ara…" style={{
            width:'100%', height: 34, paddingLeft: 32, paddingRight: 10,
            font:'400 13px var(--k-font-sans)',
            border:'1px solid var(--k-border)', borderRadius:'var(--k-r-pill)',
            background:'var(--k-bg-soft)', color:'var(--k-text)', outline:'none',
          }}/>
        </div>
      </div>
      <div style={{ overflowY:'auto', flex:1 }}>
        {MESSAGES_DATA.threads.map(t => {
          const isActive = !isMobile && t.id === active;
          return (
            <button key={t.id} onClick={() => { setActive(t.id); setView('thread'); }} style={{
              display:'flex', alignItems:'center', gap: 10, width:'100%', textAlign:'left',
              padding:'10px 14px', background: isActive ? 'var(--k-blue-50)' : 'transparent',
              border:'none', borderBottom:'1px solid var(--k-border)', cursor:'pointer',
              borderLeft: isActive ? '3px solid var(--k-blue-500)' : '3px solid transparent',
            }}>
              <div style={{ position:'relative' }}>
                <Avatar name={t.avatar} color={t.color} size={40}/>
                {t.online && (
                  <span style={{
                    position:'absolute', right:-1, bottom:-1, width:11, height:11, borderRadius:'50%',
                    background:'var(--k-success)', border:'2px solid var(--k-bg-elev)',
                  }}/>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <span style={{ font:'600 13.5px var(--k-font-sans)' }}>{t.name}</span>
                  <span style={{ font:'400 11px var(--k-font-mono)', color:'var(--k-text-3)' }}>{t.time}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 2 }}>
                  <span style={{ flex:1, font:`${t.unread?500:400} 12.5px var(--k-font-sans)`,
                                 color: t.unread ? 'var(--k-text)' : 'var(--k-text-3)',
                                 overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.preview}</span>
                  {t.unread > 0 && (
                    <span style={{
                      background:'var(--k-blue-500)', color:'#fff', font:'700 10px var(--k-font-mono)',
                      padding:'2px 6px', borderRadius: 99, minWidth: 18, textAlign:'center',
                    }}>{t.unread}</span>
                  )}
                </div>
                {t.duel && (
                  <div style={{ marginTop: 4, display:'inline-flex', alignItems:'center', gap: 4,
                                font:'500 10.5px var(--k-font-sans)', color:'var(--k-coral-500)',
                                padding:'1px 6px', borderRadius: 99, background:'var(--k-coral-50)' }}>
                    <Icons.swords size={10}/> {t.duel}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const Thread = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, padding:'12px 16px',
                    borderBottom:'1px solid var(--k-border)' }}>
        {isMobile && (
          <button onClick={()=>setView('list')} style={{
            background:'none', border:'none', cursor:'pointer', padding: 4, color:'var(--k-text)',
          }}><Icons.chevronRight size={20} style={{ transform:'rotate(180deg)' }}/></button>
        )}
        <Avatar name={thread.avatar} color={thread.color} size={36}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ font:'600 14px var(--k-font-sans)' }}>{thread.name}</div>
          <div style={{ font:'400 11.5px var(--k-font-mono)', color: thread.online ? 'var(--k-success)' : 'var(--k-text-3)' }}>
            {thread.online ? '● çevrimiçi' : '○ son görülme 2s'}
          </div>
        </div>
        <button className="k-btn k-btn-outline" style={{ height: 32, padding:'0 12px', fontSize: 12 }}>
          <Icons.swords size={13}/> Düello
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px',
                    display:'flex', flexDirection:'column', gap: 8,
                    background:'var(--k-bg)' }}>
        <div style={{ alignSelf:'center', font:'500 11px var(--k-font-mono)',
                      color:'var(--k-text-3)', padding:'4px 10px',
                      background:'var(--k-bg-elev)', borderRadius: 99, border:'1px solid var(--k-border)' }}>
          Bugün · 14:00
        </div>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
            maxWidth: '78%', display:'flex', flexDirection:'column', gap: 2,
          }}>
            {m.side && (
              <div style={{
                alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
                font:'600 10px var(--k-font-sans)',
                color: m.side === 'sicak' ? 'var(--k-coral-500)' : 'var(--k-blue-500)',
                marginBottom: 2, padding:'2px 7px', borderRadius: 99,
                background: m.side === 'sicak' ? 'var(--k-coral-50)' : 'var(--k-blue-50)',
              }}>
                {m.side === 'sicak' ? '🔥 Sıcak tarafı' : '❄️ Soğuk tarafı'}
              </div>
            )}
            <div style={{
              padding:'9px 13px', borderRadius: 16,
              background: m.from === 'me' ? 'var(--k-blue-500)' : 'var(--k-bg-elev)',
              color: m.from === 'me' ? '#fff' : 'var(--k-text)',
              border: m.from === 'me' ? 'none' : '1px solid var(--k-border)',
              font:'400 14px/1.4 var(--k-font-sans)',
              borderBottomRightRadius: m.from === 'me' ? 4 : 16,
              borderBottomLeftRadius:  m.from === 'me' ? 16 : 4,
            }}>{m.t}</div>
            <span style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
                           font:'400 10px var(--k-font-mono)', color:'var(--k-text-3)', padding:'0 4px' }}>{m.time}</span>
          </div>
        ))}
        {/* Duel invite card */}
        <div className="k-card" style={{ alignSelf:'stretch', padding: 14, marginTop: 4,
                                          background:'linear-gradient(135deg, #eef4ff, #dbe7ff)',
                                          borderColor:'var(--k-coral-200)' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
            <Icons.swords size={16} style={{ color:'var(--k-coral-600)' }}/>
            <span style={{ font:'700 13px var(--k-font-sans)', color:'var(--k-coral-600)' }}>Düello çağrısı</span>
          </div>
          <div style={{ font:'500 13.5px var(--k-font-sans)', marginBottom: 10 }}>
            “Pazar günü aile ziyaretinde, anneannenizin eski sevgilisiyle…”
          </div>
          <div style={{ display:'flex', gap: 6 }}>
            <button className="k-btn k-btn-coral" style={{ height: 32, fontSize: 12.5, flex:1 }}>Kabul et</button>
            <button className="k-btn k-btn-outline" style={{ height: 32, fontSize: 12.5, flex:1 }}>Reddet</button>
          </div>
        </div>
      </div>
      <div style={{ padding:'10px 12px', borderTop:'1px solid var(--k-border)',
                    background:'var(--k-bg-elev)', display:'flex', gap: 8, alignItems:'flex-end' }}>
        <button className="k-btn k-btn-ghost" style={{ width: 34, height: 34, padding: 0, borderRadius: 99 }}>
          <Icons.plus size={18}/>
        </button>
        <textarea rows={1} placeholder="Mesaj yaz…" style={{
          flex:1, resize:'none', font:'400 14px/1.4 var(--k-font-sans)',
          border:'1px solid var(--k-border)', borderRadius: 18,
          padding:'8px 14px', background:'var(--k-bg-soft)', color:'var(--k-text)', outline:'none',
          maxHeight: 80,
        }}/>
        <button className="k-btn k-btn-primary" style={{ width: 36, height: 36, padding: 0, borderRadius: 99 }}>
          <Icons.arrowUp size={18}/>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      display:'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
      height: isMobile ? 'calc(100vh - 54px - 64px - 28px)' : 'calc(100vh - 100px)',
      minHeight: 480,
      borderRadius:'var(--k-r-lg)', background:'var(--k-bg-elev)',
      border:'1px solid var(--k-border)', overflow:'hidden',
    }}>
      {isMobile ? (view === 'list' ? ThreadList : Thread) : (<>{ThreadList}<div style={{borderLeft:'1px solid var(--k-border)'}}>{Thread}</div></>)}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ARŞİV — Archive (past scenarios by date)
// ─────────────────────────────────────────────────────────────────────────────
const ARCHIVE_DATA = [
  { date:'10 Mayıs 2026', day:'Pazar', mode:'senaryo',
    title:'Pazar günü aile ziyaretinde, anneannenizin eski sevgilisiyle karşılaşınca, ona sarılmalı mı yoksa soğuk mu davranmalısın?',
    answers: 1284, duellos: 42, winner:{ name:'Zeynep Ak', side:'sicak' }, mySide:'soguk', myWin: false },
  { date:'9 Mayıs 2026', day:'Cumartesi', mode:'emoji',
    title:'Sevgilinin eski fotoğraflarını gizlice gördüğünde ne hissediyorsun?',
    answers: 904, duellos: 28, winner:{ name:'Mert Y.', side:'sicak' }, mySide:'sicak', myWin: true },
  { date:'8 Mayıs 2026', day:'Cuma', mode:'karakter',
    title:'Bir Hogwarts profesörü olsaydın, öğrencini sınavda kopya çekerken yakaladığında ne derdin?',
    answers: 2100, duellos: 91, winner:{ name:'Zeynep Ak', side:'sicak' }, mySide:'sicak', myWin: false },
  { date:'7 Mayıs 2026', day:'Perşembe', mode:'tartisma',
    title:'Yapay zekayla yapılan sohbetler "gerçek" bir arkadaşlık sayılır mı?',
    answers: 1640, duellos: 58, winner:{ name:'Ela Hasımoglu', side:'soguk' }, mySide:'sicak', myWin: false },
  { date:'6 Mayıs 2026', day:'Çarşamba', mode:'senaryo',
    title:'Asansörde bir yabancının düşürdüğü cüzdanı görünce ne yaparsın?',
    answers: 820, duellos: 21, winner:{ name:'Mert Y.', side:'soguk' }, mySide:'soguk', myWin: true },
];

const ArchiveScreen = ({ vp }) => {
  const [filter, setFilter] = useStateX('all');
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="k-card" style={{
        padding: isMobile ? 18 : 22, display:'flex', alignItems:'center', gap: 16, flexWrap:'wrap',
        background:'linear-gradient(135deg, #1442a8, #2a6cf0)', color:'#fff', border:'none',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background:'rgba(255,255,255,0.16)',
                       display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icons.archive size={24}/>
        </div>
        <div style={{ flex:1, minWidth: 200 }}>
          <h1 style={{ margin:0, font:'700 22px/1.1 var(--k-font-sans)', letterSpacing:'-0.02em' }}>Senaryo Arşivi</h1>
          <p style={{ margin:'4px 0 0', font:'400 13.5px var(--k-font-sans)', opacity:.88 }}>
            Geçmiş günlerin senaryolarını oku, oyları gör, eksik cevap verdiğin günleri tamamla.
          </p>
        </div>
        <div style={{ display:'flex', gap: 22, padding:'4px 8px' }}>
          <div><div style={{ font:'700 22px var(--k-font-mono)' }}>248</div>
               <div style={{ font:'500 11px var(--k-font-sans)', opacity:.88, textTransform:'uppercase', letterSpacing:'.04em' }}>Toplam</div></div>
          <div><div style={{ font:'700 22px var(--k-font-mono)' }}>42</div>
               <div style={{ font:'500 11px var(--k-font-sans)', opacity:.88, textTransform:'uppercase', letterSpacing:'.04em' }}>Cevapladığın</div></div>
          <div><div style={{ font:'700 22px var(--k-font-mono)', color:'#bff5d5' }}>14</div>
               <div style={{ font:'500 11px var(--k-font-sans)', opacity:.88, textTransform:'uppercase', letterSpacing:'.04em' }}>Galibiyet</div></div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
        {[
          { id:'all',      l:'Tümü' },
          { id:'answered', l:'Cevapladıklarım' },
          { id:'won',      l:'Kazandıklarım', c:'var(--k-success)' },
          { id:'lost',     l:'Kaybettiklerim', c:'var(--k-coral-500)' },
          { id:'missed',   l:'Cevapsız' },
        ].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            padding:'8px 14px', borderRadius:'var(--k-r-pill)',
            border:'1px solid ' + (filter===f.id ? 'transparent' : 'var(--k-border)'),
            background: filter===f.id ? 'var(--k-text)' : 'var(--k-bg-elev)',
            color: filter===f.id ? '#fff' : (f.c || 'var(--k-text-2)'),
            font:'500 13px var(--k-font-sans)', cursor:'pointer',
          }}>{f.l}</button>
        ))}
      </div>

      <div className="k-card" style={{ overflow:'hidden' }}>
        {ARCHIVE_DATA.map((a, i) => (
          <div key={i} style={{
            display:'flex', gap: 14, padding: isMobile ? 14 : 18,
            borderBottom: i === ARCHIVE_DATA.length-1 ? 'none' : '1px solid var(--k-border)',
            cursor:'pointer', alignItems:'flex-start',
          }}>
            <div style={{
              width: 56, flex:'none', textAlign:'center', padding:'8px 4px',
              background:'var(--k-bg-soft)', borderRadius:'var(--k-r-md)',
            }}>
              <div style={{ font:'700 18px var(--k-font-mono)' }}>{a.date.split(' ')[0]}</div>
              <div style={{ font:'500 10px var(--k-font-sans)', color:'var(--k-text-3)',
                             textTransform:'uppercase', letterSpacing:'.04em' }}>{a.date.split(' ')[1].slice(0,3)}</div>
              <div style={{ marginTop: 4, font:'500 9.5px var(--k-font-sans)', color:'var(--k-text-3)' }}>{a.day}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6, flexWrap:'wrap' }}>
                <ModeChip mode={a.mode}/>
                {a.myWin ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                                font:'600 11px var(--k-font-sans)', color:'var(--k-success)',
                                padding:'2px 8px', borderRadius: 99, background:'var(--k-success-50)' }}>
                    <Icons.check size={11}/> Kazandın
                  </span>
                ) : (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                                font:'600 11px var(--k-font-sans)', color:'var(--k-coral-500)',
                                padding:'2px 8px', borderRadius: 99, background:'var(--k-coral-50)' }}>
                    Kaybettin
                  </span>
                )}
              </div>
              <div style={{ font:'600 14.5px/1.4 var(--k-font-sans)', marginBottom: 6, textWrap:'pretty',
                             overflow:'hidden', display:'-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical' }}>
                {a.title}
              </div>
              <div style={{ display:'flex', gap: 14, font:'500 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>
                <span><Icons.msg size={12} style={{verticalAlign:'-1px'}}/> {a.answers.toLocaleString('tr-TR')}</span>
                <span><Icons.swords size={12} style={{verticalAlign:'-1px'}}/> {a.duellos}</span>
                <span>🏆 {a.winner.name}</span>
              </div>
            </div>
            {!isMobile && <Icons.chevronRight size={18} style={{ color:'var(--k-text-3)', alignSelf:'center' }}/>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KAYDETTIKLERIM — Bookmarks (tabbed collections)
// ─────────────────────────────────────────────────────────────────────────────
const BOOKMARK_DATA = {
  collections: [
    { id:'all',       l:'Tümü',          count: 24 },
    { id:'scenario',  l:'Senaryolar',    count: 12 },
    { id:'answer',    l:'Cevaplar',      count:  8 },
    { id:'duel',      l:'Düellolar',     count:  4 },
  ],
  items: [
    { kind:'answer', mode:'senaryo',
      title:'cevap → Pazar günü aile ziyaretinde…',
      body:'Sarılırım. O bir misafir, ister eski sevgili olsun ister bir komşu — anneannemin geçmişine saygım var.',
      who:{ name:'Mert Y.', avatar:'M', color:'#2a6cf0' }, time:'2g', up: 1284, side:'sicak' },
    { kind:'scenario', mode:'karakter',
      title:'Bir Hogwarts profesörü olsaydın, öğrencini sınavda kopya çekerken yakaladığında ne derdin?',
      who:{ name:'Zeynep Ak', avatar:'Z', color:'#1442a8' }, time:'3g', answers: 422 },
    { kind:'duel', mode:'tartisma',
      title:'Yapay zekayla yapılan sohbetler "gerçek" bir arkadaşlık sayılır mı?',
      who:{ name:'Ela Hasımoglu', avatar:'E', color:'#1f8df0' }, time:'1h', votes: 1240 },
    { kind:'answer', mode:'emoji',
      title:'cevap → Sevgilinin eski fotoğraflarını gizlice gördüğünde…',
      body:'😶‍🌫️ 🥲 🔥 👀',
      who:{ name:'Cesur', avatar:'C', color:'#1c2f6e' }, time:'1h', up: 220, side:'soguk' },
    { kind:'scenario', mode:'senaryo',
      title:'Sokakta gördüğün ünlü oyuncuya selam vermek mi, kendi yoluna gitmek mi?',
      who:{ name:'Topluluk', avatar:'K', color:'#2a6cf0' }, time:'1h', answers: 312 },
  ],
};

const SavedScreen = ({ vp }) => {
  const [tab, setTab] = useStateX('all');
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 10, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ margin:0, font:'700 22px var(--k-font-sans)', letterSpacing:'-0.02em' }}>Kaydettiklerim</h1>
          <p style={{ margin:'2px 0 0', font:'400 13px var(--k-font-sans)', color:'var(--k-text-3)' }}>
            Sonra okumak için kaydettiğin senaryolar ve cevaplar.
          </p>
        </div>
        <button className="k-btn k-btn-outline" style={{ height: 34 }}>
          <Icons.filter size={14}/> Filtrele
        </button>
      </div>

      <div style={{ display:'flex', gap: 6, overflowX:'auto', paddingBottom: 2 }}>
        {BOOKMARK_DATA.collections.map(c => (
          <button key={c.id} onClick={()=>setTab(c.id)} style={{
            display:'inline-flex', alignItems:'center', gap: 6,
            padding:'8px 14px', borderRadius:'var(--k-r-pill)', whiteSpace:'nowrap',
            border:'1px solid ' + (tab===c.id ? 'transparent' : 'var(--k-border)'),
            background: tab===c.id ? 'var(--k-text)' : 'var(--k-bg-elev)',
            color: tab===c.id ? '#fff' : 'var(--k-text-2)',
            font:'500 13px var(--k-font-sans)', cursor:'pointer',
          }}>
            {c.l}
            <span style={{ font:'500 11px var(--k-font-mono)',
                           color: tab===c.id ? 'rgba(255,255,255,.7)' : 'var(--k-text-3)' }}>{c.count}</span>
          </button>
        ))}
      </div>

      {/* Collection cards row */}
      <div style={{ display:'grid', gridTemplateColumns: `repeat(${isMobile?2:4}, 1fr)`, gap: 10 }}>
        {[
          { l:'Sonra Oku',   ic:<Icons.bookmark size={18}/>, c:'var(--k-blue-500)',  n: 12 },
          { l:'Favorilerim', ic:<span style={{fontSize:16}}>❤️</span>, c:'var(--k-coral-500)', n: 8 },
          { l:'Düello havuzu', ic:<Icons.swords size={18}/>, c:'var(--k-mode-tartisma)', n: 4 },
          { l:'Yeni koleksiyon', ic:<Icons.plus size={18}/>, c:'var(--k-text-3)', n: null, dashed: true },
        ].map((col, i) => (
          <button key={i} style={{
            padding: 14, borderRadius:'var(--k-r-lg)',
            background:'var(--k-bg-elev)', textAlign:'left', cursor:'pointer',
            border: col.dashed ? '1.5px dashed var(--k-border-strong)' : '1px solid var(--k-border)',
            display:'flex', flexDirection:'column', gap: 8,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: `color-mix(in oklab, ${col.c} 14%, white)`,
              color: col.c, display:'flex', alignItems:'center', justifyContent:'center',
            }}>{col.ic}</span>
            <span style={{ font:'600 13.5px var(--k-font-sans)' }}>{col.l}</span>
            {col.n !== null && (
              <span style={{ font:'500 11.5px var(--k-font-mono)', color:'var(--k-text-3)' }}>{col.n} öge</span>
            )}
          </button>
        ))}
      </div>

      <div className="k-card" style={{ overflow:'hidden' }}>
        {BOOKMARK_DATA.items.map((it, i) => {
          const kindMap = { answer:'Cevap', scenario:'Senaryo', duel:'Düello' };
          const kindIcon = { answer:<Icons.msg size={12}/>, scenario:<Icons.bolt size={12}/>, duel:<Icons.swords size={12}/> };
          return (
            <div key={i} style={{
              display:'flex', gap: 12, padding: 16,
              borderBottom: i === BOOKMARK_DATA.items.length-1 ? 'none' : '1px solid var(--k-border)',
              cursor:'pointer', alignItems:'flex-start',
            }}>
              <Avatar name={it.who.avatar} color={it.who.color} size={36}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4, flexWrap:'wrap' }}>
                  <ModeChip mode={it.mode}/>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                                font:'500 11px var(--k-font-mono)', color:'var(--k-text-3)' }}>
                    {kindIcon[it.kind]} {kindMap[it.kind]}
                  </span>
                  <span style={{ font:'500 12px var(--k-font-sans)' }}>{it.who.name}</span>
                  <span style={{ font:'400 11px var(--k-font-mono)', color:'var(--k-text-3)' }}>· {it.time}</span>
                </div>
                <div style={{ font:'600 14px/1.4 var(--k-font-sans)', textWrap:'pretty' }}>{it.title}</div>
                {it.body && (
                  <div style={{ marginTop: 6, font:'400 13.5px/1.5 var(--k-font-sans)', color:'var(--k-text-2)',
                                 overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {it.body}
                  </div>
                )}
                <div style={{ marginTop: 8, display:'flex', gap: 12, font:'500 12px var(--k-font-mono)', color:'var(--k-text-3)' }}>
                  {it.up && <span><Icons.arrowUp size={12} style={{ color:'var(--k-success)', verticalAlign:'-1px' }}/> {it.up}</span>}
                  {it.answers && <span><Icons.msg size={12} style={{ verticalAlign:'-1px' }}/> {it.answers}</span>}
                  {it.votes && <span><Icons.target size={12} style={{ verticalAlign:'-1px' }}/> {it.votes}</span>}
                </div>
              </div>
              <button style={{ background:'none', border:'none', color:'var(--k-blue-500)', cursor:'pointer', padding: 4 }}>
                <Icons.bookmark size={18} fill="currentColor"/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AYARLAR — Settings
// ─────────────────────────────────────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange?.(!on)} style={{
    width: 38, height: 22, borderRadius: 99, border:'none', cursor:'pointer',
    background: on ? 'var(--k-blue-500)' : 'var(--k-slate-200)',
    position:'relative', transition:'background .15s', padding: 0,
  }}>
    <span style={{
      position:'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius:'50%',
      background:'#fff', transition:'left .15s', boxShadow:'0 1px 2px rgba(0,0,0,.2)',
    }}/>
  </button>
);

const SettingRow = ({ icon, label, hint, right, onClick, danger }) => (
  <div onClick={onClick} style={{
    display:'flex', alignItems:'center', gap: 12, padding:'12px 16px',
    borderBottom:'1px solid var(--k-border)', cursor: onClick ? 'pointer' : 'default',
  }}>
    {icon && (
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: danger ? 'color-mix(in oklab, var(--k-danger) 12%, white)' : 'var(--k-bg-soft)',
        color: danger ? 'var(--k-danger)' : 'var(--k-text-2)',
        display:'flex', alignItems:'center', justifyContent:'center', flex:'none',
      }}>{icon}</span>
    )}
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ font:'500 14px var(--k-font-sans)', color: danger ? 'var(--k-danger)' : 'var(--k-text)' }}>{label}</div>
      {hint && <div style={{ marginTop: 2, font:'400 12px var(--k-font-sans)', color:'var(--k-text-3)' }}>{hint}</div>}
    </div>
    {right}
  </div>
);

const SettingsScreen = ({ vp, data }) => {
  const [theme, setTheme] = useStateX('light');
  const [notif, setNotif] = useStateX({ duel: true, vote: true, mention: true, follow: false, daily: true });
  const [priv, setPriv]   = useStateX({ profile: true, dms: true, leaderboard: true });
  const isMobile = vp === 'mobile';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
      <h1 style={{ margin:0, font:'700 22px var(--k-font-sans)', letterSpacing:'-0.02em' }}>Ayarlar</h1>

      {/* Account card */}
      <div className="k-card" style={{ padding: 16, display:'flex', alignItems:'center', gap: 14 }}>
        <Avatar name={data.user.avatar} color={data.user.avatarColor} size={56}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ font:'700 16px var(--k-font-sans)' }}>{data.user.name}</div>
          <div style={{ font:'400 12.5px var(--k-font-mono)', color:'var(--k-text-3)' }}>@{data.user.handle} · hasimogluayaz@gmail.com</div>
        </div>
        <button className="k-btn k-btn-outline" style={{ height: 32, padding:'0 12px', fontSize: 12.5 }}>Profili düzenle</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Görünüm */}
        <div>
          <SectionTitle>Görünüm</SectionTitle>
          <div className="k-card" style={{ overflow:'hidden' }}>
            <div style={{ padding: 14 }}>
              <div style={{ font:'500 13px var(--k-font-sans)', marginBottom: 10 }}>Tema</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 8 }}>
                {[
                  { id:'light',  l:'Açık',    bg:'#f7f8fa', fg:'#0f1320' },
                  { id:'dark',   l:'Koyu',    bg:'#0f1320', fg:'#f7f8fa' },
                  { id:'system', l:'Sistem',  bg:'linear-gradient(90deg, #f7f8fa 50%, #0f1320 50%)', fg:'#646c7e' },
                ].map(t => (
                  <button key={t.id} onClick={()=>setTheme(t.id)} style={{
                    padding: 0, height: 64, borderRadius: 10, cursor:'pointer',
                    background: t.bg, position:'relative', overflow:'hidden',
                    border:'2px solid ' + (theme===t.id ? 'var(--k-blue-500)' : 'var(--k-border)'),
                  }}>
                    <span style={{
                      position:'absolute', bottom: 6, left: 0, right: 0, textAlign:'center',
                      font:'600 11px var(--k-font-sans)', color: t.fg,
                    }}>{t.l}</span>
                    {theme===t.id && <span style={{
                      position:'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius:'50%',
                      background:'var(--k-blue-500)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                    }}><Icons.check size={11}/></span>}
                  </button>
                ))}
              </div>
            </div>
            <SettingRow icon={<Icons.bolt size={16}/>} label="Renk vurgusu"
                        hint="Mavi tonları aktif" right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>}/>
            <SettingRow icon={<span style={{font:'700 14px Geist'}}>Aa</span>} label="Yazı boyutu"
                        hint="Normal" right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>}/>
          </div>
        </div>

        {/* Bildirimler */}
        <div>
          <SectionTitle>Bildirimler</SectionTitle>
          <div className="k-card" style={{ overflow:'hidden' }}>
            <SettingRow icon={<Icons.swords size={16}/>} label="Düello çağrıları"
                        hint="Biri seni düelloya davet ettiğinde" right={<Toggle on={notif.duel} onChange={v=>setNotif({...notif, duel:v})}/>}/>
            <SettingRow icon={<Icons.arrowUp size={16}/>} label="Oy bildirimleri"
                        hint="Cevabın oy aldığında" right={<Toggle on={notif.vote} onChange={v=>setNotif({...notif, vote:v})}/>}/>
            <SettingRow icon={<span style={{font:'700 14px Geist'}}>@</span>} label="Bahsetmeler"
                        hint="Biri seni @etiketlediğinde" right={<Toggle on={notif.mention} onChange={v=>setNotif({...notif, mention:v})}/>}/>
            <SettingRow icon={<Icons.user size={16}/>} label="Yeni takipçi"
                        right={<Toggle on={notif.follow} onChange={v=>setNotif({...notif, follow:v})}/>}/>
            <SettingRow icon={<Icons.bell size={16}/>} label="Günlük senaryo hatırlatıcı"
                        hint="Her gün 09:00'da" right={<Toggle on={notif.daily} onChange={v=>setNotif({...notif, daily:v})}/>}/>
          </div>
        </div>

        {/* Gizlilik */}
        <div>
          <SectionTitle>Gizlilik</SectionTitle>
          <div className="k-card" style={{ overflow:'hidden' }}>
            <SettingRow icon={<Icons.shield size={16}/>} label="Profil herkese açık"
                        hint="Kapatırsan sadece takip ettiklerin görür" right={<Toggle on={priv.profile} onChange={v=>setPriv({...priv, profile:v})}/>}/>
            <SettingRow icon={<Icons.msg size={16}/>} label="DM herkesten al"
                        right={<Toggle on={priv.dms} onChange={v=>setPriv({...priv, dms:v})}/>}/>
            <SettingRow icon={<Icons.trophy size={16}/>} label="Liderlik tablosunda görün"
                        right={<Toggle on={priv.leaderboard} onChange={v=>setPriv({...priv, leaderboard:v})}/>}/>
            <SettingRow icon={<Icons.x size={16}/>} label="Engellenenler"
                        hint="3 kullanıcı engellendi" right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>} onClick={()=>{}}/>
          </div>
        </div>

        {/* Hesap */}
        <div>
          <SectionTitle>Hesap</SectionTitle>
          <div className="k-card" style={{ overflow:'hidden' }}>
            <SettingRow icon={<Icons.user size={16}/>} label="E-posta adresi"
                        hint="hasimogluayaz@gmail.com" right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>} onClick={()=>{}}/>
            <SettingRow icon={<Icons.shield size={16}/>} label="Şifre değiştir"
                        right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>} onClick={()=>{}}/>
            <SettingRow icon={<Icons.archive size={16}/>} label="Verilerimi indir"
                        hint="GDPR / KVKK" right={<Icons.chevronRight size={16} style={{color:'var(--k-text-3)'}}/>} onClick={()=>{}}/>
            <SettingRow icon={<Icons.x size={16}/>} label="Hesabı sil"
                        hint="Bu işlem geri alınamaz" danger right={<Icons.chevronRight size={16} style={{color:'var(--k-danger)'}}/>} onClick={()=>{}}/>
          </div>
        </div>
      </div>

      <div style={{ font:'400 12px var(--k-font-mono)', color:'var(--k-text-3)', textAlign:'center', padding: 14 }}>
        Kapisio v2.1.0 · Türkiye · KVKK uyumlu · SSL korumalı
      </div>
    </div>
  );
};

Object.assign(window, {
  MessagesScreen, ArchiveScreen, SavedScreen, SettingsScreen,
});
