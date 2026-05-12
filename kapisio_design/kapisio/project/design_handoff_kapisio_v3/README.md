# Kapisio — v3 Tasarım Handoff

Bu paket, **Kapisio'nun yeniden tasarımı (v3)** için Claude Code'a verilecek tam handoff dökümanıdır.

> **Hedef**: Bu paketteki HTML/JSX tasarım referanslarını **gerçek `duel-app/` Next.js + Tailwind + Supabase kodbazına** uygulamak. Mockup'ları kopyalayıp yapıştırma değil — kodbazın mevcut pattern'leriyle (Next.js App Router, Tailwind, `components/ui/*` primitives, Supabase RPC'leri) yeniden inşa.

---

## 1. Tasarım Dosyaları Hakkında

Bu paketteki **HTML/JSX dosyaları gerçek üretim kodu değil** — React'in inline JSX + Babel CDN yaklaşımıyla çalışan yüksek doğrulukta prototiplerdir. Tasarım niyetini, renkleri, tipografiyi, hiyerarşiyi ve etkileşim akışlarını gösterirler.

**Görev**: bu prototipi `duel-app/` Next.js kodbazında, mevcut yapıyla yeniden kurmak:
- `app/(routes)/page.tsx` — Server Components
- `components/ui/*` — Button, Card, Avatar, Badge gibi primitive'ler
- `app/globals.css` + `tailwind.config.ts` — token tabanı
- Supabase RPC ve `cookies()` auth pattern'i aynen

---

## 2. Doğruluk Seviyesi

**Hi-fi.** Tüm renkler, tipografi (Geist + Geist Mono), spacing, border radius, gölgeler, hover state'leri kesin değerlerdir. Mockup'ı pixel-perfect şekilde Tailwind'de yeniden üretmek esas hedef.

---

## 3. Tasarım Felsefesi — v1'den v3'e

Kapisio'nun zaten oturmuş bir DNA'sı vardı (v1). v3 sıfırdan başlamadı; **v1'in iskeleti aynen korundu, üstüne keskin müdahaleler yapıldı**.

### Korunanlar (v1'den miras)
- **Font ailesi**: Sadece `Geist` (UI) + `Geist Mono` (sayılar). Serif yok.
- **Birincil renk**: Kapisio mavisi `#2a6cf0` (#k-blue-500)
- **3 kolonlu desktop layout**: 264px sidebar + esnek main + 320px right rail
- **Mobil**: Top bar + content + bottom-tab (5 sekme) + merkez FAB
- **Mode chip sistemi**: Senaryo / Emoji / Karakter / Tartışma — her birinin kendi rengi
- **Kart tabanlı feed**, FAB ile senaryo oluşturma, rank pill'leri (Çaylak/Düellocu/Usta/Şampiyon + emoji)

### v3'te eklenen keskin müdahaleler

| № | Müdahale | Açıklama |
|---|---|---|
| 01 | **Sıcak/Soğuk gerçek semantik** | v1'de iki taraf da laciverteydi → ayırt edilemiyordu. v3'te `Sıcak = turuncu #ed6f1c`, `Soğuk = mavi #2a6cf0`. UI'ın her yerinde tutarlı. |
| 02 | **Tug-of-war çubuğu** | Yüzde gösteren basit bar değil — ortada siyah ip işareti, iki tarafın gradient renkleri çekişiyor. Hero, detay, feed duello kartında. |
| 03 | **İki kolonlu Arena (detay sayfası)** | Sıcak cevaplar solda, Soğuk'unkiler sağda — duruşma metaforu. Mobilde 🔥 / Tümü / ❄️ pill toggle. |
| 04 | **Daha keskin tipografi** | Manşetler `Geist 800`, `-0.035em` letter-spacing. Eyebrow uppercase 0.1em. `font-variant-numeric: tabular-nums` tüm sayılarda. |
| 05 | **Hero `?` filigran + canlı puls** | Generic mavi SaaS gradient değil; devasa `?` arka plan, canlı dot pulse, +243 katılımcı avatar stack. |
| 06 | **Gerçek altın/gümüş/bronz podyum** | v1'de düz bar vardı. v3'te madalya emojisi + gradient pedestal + 800-weight rakam. |
| 07 | **Başarım strip (profil)** | Profile 4 mini başarım kartı: 3 günlük seri, ilk düello, tartışmacı, topluluk oyu. |
| 08 | **Mobil bottom-nav pill highlight** | Aktif sekmede sadece renk değil; ikon mavi pill içine alınıyor — dokunma alanı genişler, görsel netlik artar. |

---

## 4. Tasarım Token'ları

### 4.1 Renkler

**Kapisio mavi (birincil) — bu zaten kodbazında var, sadece kontrol et:**
```css
--k-blue-50:  #eef4ff;
--k-blue-100: #dbe7ff;
--k-blue-200: #b8cfff;
--k-blue-300: #88aeff;
--k-blue-400: #5188fa;
--k-blue-500: #2a6cf0;  /* primary, logo */
--k-blue-600: #1a56d6;
--k-blue-700: #1442a8;
--k-blue-900: #0a1f55;
```

**Sıcak (warm) — YENİ, ekle:**
```css
--k3-warm-50:  #fff1e6;
--k3-warm-100: #ffdcbf;
--k3-warm-200: #ffbe83;
--k3-warm-400: #f58a3c;
--k3-warm-500: #ed6f1c;  /* sıcak tarafı */
--k3-warm-600: #c8540e;
--k3-warm-700: #93390a;
```

**Mod renkleri:**
```css
--k-mode-senaryo:  #2a6cf0;  /* mavi  */
--k-mode-emoji:    #4aa8ff;  /* sky   */
--k-mode-karakter: #1442a8;  /* navy  */
--k-mode-tartisma: #1c2f6e;  /* deep  */
```

**Yüzey ve metin (v3 değerleri — `globals.css`'teki cool slate'i hafifçe sıcak yöne çek):**
```css
--bg:           #f4f6fa;   /* eskiden #f7f8fa */
--surface:      #ffffff;
--surface-2:    #eef1f6;   /* eskiden #eef0f4 */
--stroke:       #e1e6ee;   /* eskiden #e4e7ed */
--stroke-2:     #cfd6e2;
--fg:           #0a0f1e;   /* eskiden #0f1320 */
--fg-muted:     #3a4256;
--fg-subtle:    #6e7892;
```

**Semantik:**
```css
--success: #16a34a;
--success-50: #ecfdf3;
--danger:  #dc2626;
--warning: #d97706;
```

**Gölgeler:**
```css
--shadow-card: 0 1px 2px rgba(10,15,30,.04), 0 4px 16px rgba(10,15,30,.04);
--shadow-hero: 0 24px 60px -20px rgba(20,66,168,.45), 0 8px 20px -10px rgba(10,15,30,.2);
```

### 4.2 Tipografi

**Font yüklemesi** (zaten kodbazında var, sadece weight 900'ü ekle):
```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');
```

**Tip ölçeği** (Tailwind-friendly):

| Sınıf | Font | Weight | Size | Line | Tracking | Kullanım |
|---|---|---|---|---|---|---|
| `h1-display` | Geist | 800 | 36px (mobile: 26) | 1.02 | -0.035em | Hero manşet, scenario başlığı |
| `h2-display` | Geist | 800 | 32px / 22 | 1.02 | -0.035em | Liderlik başlığı, profil ismi |
| `h-headline` | Geist | 700 | 19px / 18 | 1.1 | -0.025em | Feed kart başlığı |
| `h-section` | Geist | 700 | 20-22px | 1.1 | -0.025em | Section başlıkları |
| `body` | Geist | 400-500 | 14-15px | 1.5 | 0 | Genel metin |
| `eyebrow` | Geist | 700 | 11px | 1 | 0.1em uppercase | Bölüm üstü etiket |
| `meta` | Geist Mono | 400-500 | 11-12px | 1 | 0 | Zaman, sayı, handle |
| `stat-big` | Geist | 800 | 30px | 1 | -0.02em | Profil istatistik rakamları |

**Tabular nums için utility** (kodbazına ekle):
```css
.tab-nums { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }
```

### 4.3 Spacing & Radius

```
Radius:  sm=8px  md=12px  lg=14px  xl=18px  2xl=22px  pill=999px
Spacing: kart padding 16-18px (mobile) / 18-28px (desktop)
Section gap: 14-18px
Feed item gap: 10px
```

### 4.4 Animasyon

```css
@keyframes live-pulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50%     { transform: scale(1.4); opacity: .4; }
}
.live-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
.live-dot::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: #16a34a; animation: live-pulse 1.6s ease-out infinite;
}
```

---

## 5. Ekran-Ekran Spesifikasyon

### 5.1 Anasayfa (`app/page.tsx` veya `app/oyun/page.tsx`)

**Mevcut**: SaaS landing-style, gradient blob hero, "Yaz. Kapış. Kazan." başlık, stat row, mode card grid, recent duels.

**v3 Hedefi**: Topluluk akışı odaklı. Hero = "Günün senaryosu arena kartı", altında filtre çubuğu, altında feed.

**Yapı**:
```
<main>
  <ArenaHero scenario={today} />                     <!-- 1 kart, koyu mavi gradient -->
  <FilterRail filters={[top|new|duels|follow]} />    <!-- yatay pill -->
  <Feed items={feed}>
    {feed.map(item => <FeedCard item={item} />)}
  </Feed>
</main>
```

#### ArenaHero — detaylı spec

- **Konteyner**: `border-radius: 22px`, padding desktop 28px / mobile 20px
- **Arka plan**: `linear-gradient(160deg, #0a1f55 0%, #1442a8 38%, #2a6cf0 100%)`
- **Gölge**: `0 24px 60px -20px rgba(20,66,168,.45), 0 8px 20px -10px rgba(10,15,30,.2)`
- **Filigran "?"**: `position: absolute; right: -30px; top: -50px; font-size: 320px; line-height: 1; color: rgba(255,255,255,0.04); letter-spacing: -0.05em`
- **Top status row**:
  - Sol: pill, `padding: 5px 12px`, `bg: rgba(255,255,255,0.15)`, içinde canlı yeşil puls dot (`#bff5d5`) + "GÜNÜN SENARYOSU" uppercase 0.08em 11px 700, ardından mono tarih
  - Sağ: `clock` icon + "Yenilenmeye 02:17:20" mono 12px 600
- **Manşet** (`h1`): Geist 800, 36px desktop / 26px mobile, color white, `text-wrap: balance`, margin 22px 0
- **Tug bar** (12px yükseklik):
  - Sıcak yüzde sol, Soğuk yüzde sağ, ortada `width: 4px` beyaz rope marker (`box-shadow: 0 0 12px rgba(255,255,255,0.7)`)
  - Sıcak gradient: `linear-gradient(90deg, #f58a3c, #ed6f1c)`
  - Soğuk gradient: `linear-gradient(90deg, #4aa8ff, #88aeff)`
- **Cevap paneli** (cevap verildiyse):
  - `bg: rgba(255,255,255,0.1)`, `backdrop-filter: blur(8px)`, `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 14px`
  - Sol: SideChip (Sıcak/Soğuk) + "Cevabın" eyebrow + cevap metni
  - Sağ: 2 buton — "Düello" (beyaz bg, mavi-700 fg) ve "247 cevap" (white-16% bg)
- **Participation strip**: avatar stack (-7px overlap, beyaz border) + "+243 katıldı"

#### FeedCard — detaylı spec

- **Konteyner**: `Card` primitive — `bg: white`, `border: 1px solid #e1e6ee`, `border-radius: 18px`, padding 18px (desktop) / 16px (mobile), `shadow-card`
- **Header satırı** (10px alt margin):
  - ModeChip (rengi mode'a göre, height 22px, padding 0 8px, 11px 600 + dot)
  - Author: avatar 22px + name 13px 600 + "· {time}" mono 12px subtle
  - Sağ: "more" icon button
- **Duello varsa**: avatar + "VS" pill (`bg: #eef1f6`, `color: #6e7892`, 7px 11px font-mono 700) + avatar + name
- **Başlık**: Geist 700, 19px (mobile 18), `letter-spacing: -0.025em`, line-height 1.1, `text-wrap: pretty`
- **Preview**: 14px 400, color `--fg-muted`, line-clamp 2
- **Duello tug bar**: compact mode (10px yükseklik)
- **Footer**:
  - Sol grup: oy kontrolü (Reddit-style ↑ {sayı} | ↓, 1px pill border), sonra `msg`, `flame` (turuncu) sayıları
  - Sağ: bookmark + share icon-only
  - Oy kontrolü `border-radius: 999px`, `border: 1px solid #e1e6ee`, padding 2px
  - Up active: bg `--success-50`, color `--success`
  - Down active: bg/color `--k3-warm-600`

### 5.2 Senaryo Detay (`app/scenario/[id]/page.tsx` veya benzer)

**Yapı**:
```
<main>
  <ScenarioCard headline votes yourAnswer />
  <ArenaHeader sort tabs />
  <ArenaTwoColumn>
    <ArenaColumn side="sicak" answers={warmAnswers} />
    <ArenaColumn side="soguk" answers={coolAnswers} />
  </ArenaTwoColumn>
  <LoadMoreButton />
</main>
```

#### ArenaColumn

- **Header**: 32px ikon kare (turuncu/mavi bg + 🔥/❄️ emoji) + eyebrow + "{count} savunucu" 16px 700 + "Yaz" CTA butonu (kolon rengi)
- **Header bg**: Sıcak için `var(--k3-warm-50)`, border `var(--k3-warm-100)`
- **Header bg**: Soğuk için `var(--k-blue-50)`, border `var(--k-blue-100)`
- **Cevap kartı**:
  - `border-left: 3px solid` (Sıcak: #ed6f1c, Soğuk: #2a6cf0)
  - Author chip + rank pill + zaman + sağda 🏅 (gilded ise)
  - Cevap metni: Geist 500, 15px, line-height 1.5
  - Footer: oy kontrolü + reply count + "Düello" link (taraf renginde)

**Mobilde**: tek kolon. Üstte 3-pill toggle (🔥 / Tümü / ❄️) hangi tarafı göstereceğini seçer. Pill toggle: `bg: var(--surface-2)`, içinde aktif olan beyaz bg ile öne çıkar.

### 5.3 Liderlik (`app/liderlik/page.tsx`)

**Yapı**:
```
<main>
  <LeaderHero scope={day|week|month|all} />
  <Podium top3 />              <!-- sadece desktop -->
  <LeaderboardTable rows={leaderboard} />
</main>
```

#### Podium

- 3 kolonlu grid: `1fr 1.15fr 1fr` (orta sütun #1)
- Yükseklikler: #1 → 170px, #2 → 130px, #3 → 100px
- Gradient pedestaller:
  - Altın: `linear-gradient(180deg, #fcd34d, #d97706)`
  - Gümüş: `linear-gradient(180deg, #e5e7eb, #94a3b8)`
  - Bronz: `linear-gradient(180deg, #fdba74, #b45309)`
- Üstte rakam: `font-weight: 900`, 36px, `letter-spacing: -0.04em`, color white
- Avatar (78px #1, 60px diğerleri) + medal emoji (🥇🥈🥉) bottom-right köşede
- Pedestal insetshadow: `inset 0 -20px 40px rgba(0,0,0,0.12)`

#### Tablo

- Sticky header: bg `var(--surface-2)`, eyebrow stilinde başlıklar
- Grid: `50px 1fr 90px 90px 90px` desktop, `40px 1fr 90px` mobile
- Kullanıcı satırı:
  - № kolonu: ilk 3 için 800 weight (Geist 17px), 4+ için 700 (14px); ilk 3 renkler altın/gümüş/bronz
  - Avatar 34px + isim 14px 600 + handle mono 11.5px
  - Kendin: `bg: var(--k-blue-50)` + isim yanına "SEN" pill (mavi bg, beyaz fg, 10px 800)
  - Puan: `tab-nums`, Geist 700, 15px
  - Delta: + → success, - → warm-600, 0 → subtle

### 5.4 Profil (`app/profil/[username]/page.tsx`)

**Yapı**:
```
<main>
  <ProfileHero user />                  <!-- cover + avatar + name + actions -->
  <AchievementStrip badges />           <!-- 4 mini kart -->
  <ProfileTabs tabs />
  <ProfileFeed content={answers} />
</main>
```

#### ProfileHero

- Cover: 128px (mobile 100px), gradient `linear-gradient(135deg, #0a1f55 0%, #1442a8 50%, #2a6cf0 100%)`
- Cover üstüne overlay: `radial-gradient(at 25% 60%, rgba(237,111,28,0.25), transparent 40%), radial-gradient(at 80% 30%, rgba(255,255,255,0.12), transparent 50%)`
- Avatar 100px (mobile 72px), beyaz 4px ring, kapağın -48px üzerinde
- İsim: `h1-display` 30px (mobile 22)
- Handle satırı: `@user · Rank Icon · İstanbul` mono 13px subtle
- Action butonları: "Düzenle" outline + "Düello at" primary (mavi)
- **Stats grid** (üstte 1px stroke ile ayrılmış):
  - 4 kolon (mobile 2x2), aralarında 1px stroke
  - Her hücre: eyebrow label + 30px (mobile 24px) Geist 800 rakam (tabular)
  - Puan/Düello: `--fg` siyah
  - Galibiyet: `--success` yeşil
  - Seri: `--k3-warm-500` turuncu + 🔥 ikon
- **Rank progress** (16px alt):
  - Eyebrow: "Çaylak 🥚 → Düellocu"
  - Sağ: `{points} / {nextRankAt}` mono
  - Bar: 8px yükseklik, fill `linear-gradient(90deg, var(--k3-warm-400), var(--k3-warm-500))`

#### AchievementStrip

4 mini kart, grid `repeat(4, 1fr)` (mobile 2x2):
- 40px renkli ikon kutusu (radius 12, bg `color-mix` ile pastel) + başlık 13px 700 + sub-label mono 11px

### 5.5 Keşfet (`app/kesfet/page.tsx`)

**Yapı**:
```
<main>
  <SearchInput />
  <FeaturedCard editorPick />         <!-- 2 kolon: turuncu sol panel + sağ özet -->
  <CategoriesGrid cats={8} />         <!-- 4x2 mobile 2x4 -->
  <RisingFeed items={top3} />
</main>
```

#### FeaturedCard (editör seçimi)

- Iki kolon (mobile tek): sol turuncu gradient panel + sağ beyaz panel
- Sol panel:
  - Gradient: `linear-gradient(155deg, #ed6f1c 0%, #c8540e 60%, #93390a 100%)`
  - Eyebrow: "HAFTANIN SENARYOSU · EDİTÖR SEÇİMİ" (beyaz %85)
  - Başlık: Geist 700, 28px, white
  - Author chip
- Sağ panel:
  - ModeChip + tag eyebrow
  - Açıklama 15px 500
  - Footer: stat rakamlar + "Oku →" outline button

#### CategoriesGrid

- Her kart `Card`: 14px padding, 40px renkli ikon kutusu (`color-mix(in oklab, ${cat.color} 14%, white)`) + label 14px 700 + count mono 11.5px subtle
- Mode renkleri kategori başına farklı

### 5.6 Mobil Bottom-Nav

5 sekme: Anasayfa / Keşfet / [+ FAB] / Liderlik / Profil(Menü)

- Yükseklik 68px, sticky bottom
- Background `rgba(255,255,255,0.96)` + `backdrop-blur(10px)`
- Border top 1px `--stroke`

**Sekme**:
- İkon (20px) + label (10px)
- Aktif: ikon mavi pill içinde (`bg: var(--k-blue-50)`, padding 4px 14px), label 700 mavi
- İnaktif: subtle gri
- Badge (varsa): `--k3-warm-500` bg, beyaz fg, 9px 700 mono, top-right -2px

**FAB**:
- 54x54px, radius 18, `linear-gradient(140deg, #4aa8ff, #1442a8)`, `box-shadow: 0 8px 22px -4px rgba(42,108,240,0.5)`
- `transform: translateY(-14px)` (nav'dan dışarı çıkar)
- İçinde + ikon (24px white)

### 5.7 Desktop Sol Sidebar

- 264px sabit genişlik
- Üstte logo (28px)
- 9 nav item (Anasayfa, Keşfet, Liderlik, Bildirimler, Mesajlar, Arşiv, Kaydettiklerim, Profil, Ayarlar)
- Her item: 19px ikon + label
- **Aktif state**: `bg: var(--k-blue-50)`, `color: var(--k-blue-700)`, sol kenarda 3px mavi accent bar (`position: absolute; left: -14px; top: 8px; bottom: 8px`)
- Badge'ler: bildirimler 6, mesajlar 3 — turuncu pill
- Altında "Senaryo Oluştur" primary buton (46px, primary mavi, shadow)
- Streak kartı: turuncu gradient, fire icon + "4 günlük seri" + 7-gün progress dot satırı
- En altta user chip (avatar + name + "more")

### 5.8 Desktop Right Rail (320px)

- Bugün canlı nabız kart: compact TugBar + "247 cevap · 12 düello"
- Trend etiketler (flex-wrap pill listesi, mavi tag + mono count)
- Bu hafta liderler (top 4 mini tablo)
- Tanıyor olabilirsin (3 user + "Takip" outline button)

---

## 6. Tailwind Config — eklemeler

`tailwind.config.ts` içine ekle:

```ts
export default {
  // ...
  theme: {
    extend: {
      colors: {
        // mevcut --primary vb. korunur
        warm: {
          50:  '#fff1e6',
          100: '#ffdcbf',
          200: '#ffbe83',
          400: '#f58a3c',
          500: '#ed6f1c',
          600: '#c8540e',
          700: '#93390a',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '22px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,15,30,.04), 0 4px 16px rgba(10,15,30,.04)',
        hero: '0 24px 60px -20px rgba(20,66,168,.45), 0 8px 20px -10px rgba(10,15,30,.2)',
        warm: '0 6px 16px -4px rgba(237,111,28,0.5)',
      },
      keyframes: {
        'live-pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: '1' },
          '50%':     { transform: 'scale(1.4)', opacity: '.4' },
        },
      },
      animation: {
        'live-pulse': 'live-pulse 1.6s ease-out infinite',
      },
    },
  },
}
```

---

## 7. Component Mapping — Mockup ↔ Gerçek Kodbaz

| Mockup component | Hedef dosya | Aksiyon |
|---|---|---|
| `<ArenaHero>` (screens-v3.jsx) | `components/scenarios/TodayScenarioHero.tsx` (yeni) | Tamamen yeni component |
| `<TugBarV3>` | `components/scenarios/TugBar.tsx` (yeni) | Reusable, hem hero hem detay hem feed kullanır |
| `<FeedCardV3>` | `components/feed/DuelFeedCard.tsx` (mevcut, refactor) | Mevcut kartın görsel dilini v3'e çek |
| `<SideChipV3>` | `components/ui/SideChip.tsx` (yeni) | Sıcak/Soğuk pill — 2 varyant |
| `<ArenaColumnV3>` + `<ArenaAnswerV3>` | `components/scenarios/Arena.tsx` (yeni) | Detay sayfasında 2 kolon |
| `<LeaderboardScreenV3>` | `app/liderlik/page.tsx` | Server Component olarak yeniden yaz |
| Podium | `components/leaderboard/Podium.tsx` (yeni) | Top 3 |
| `<ProfileScreenV3>` | `app/profil/[username]/page.tsx` | Layout aynen, içerik Supabase'den |
| `<AchievementStrip>` | `components/profile/AchievementStrip.tsx` (yeni) | 4 mini kart |
| `<DesktopShellV3>` (sidebar, right rail) | `components/layout/LeftSidebar.tsx`, `RightSidebar.tsx` (mevcut, güncelle) | v3 nav stilleri |
| `<MobileShellV3>` (bottom-nav, FAB) | `components/layout/BottomNav.tsx`, `CreateFAB.tsx` (mevcut, güncelle) | Pill highlight + FAB gradient |

---

## 8. Eksiklerin Tamamlanması

Mockup'ta yer almayan ama gerçek uygulama için gerekli olanlar — bunları sen de oluştur:

### 8.1 Loading state'leri
- Hero, feed kart ve podyum için skeleton variantları (mevcut `Spinner` yerine veya yanında)
- Skeleton tonu: `--surface-2`, animate-pulse

### 8.2 Boş state'ler
- "Henüz cevap yok" / "Henüz düello yok" — büyük ikon + 14px 600 metin + outline CTA
- Renk: subtle gri

### 8.3 Error state'leri
- Toast (zaten var) — danger rengi `#dc2626`
- Inline error: kart üstünde `border: 1px solid #fecaca; bg: #fef2f2; color: #991b1b; padding: 10px 14px; radius: 12px`

### 8.4 Dark mode
- Kodbazda zaten `.dark` sınıfı var
- v3 için dark adaptasyonu (öncelik düşük, sonra ekleyebiliriz):
  - `--bg: #0a0f1e`, `--surface: #0f1424`, `--surface-2: #18203a`
  - `--fg: #e7e9ea`
  - Sıcak ton aynen kalır (turuncu dark'ta da çalışır)
  - Mavi ton biraz açılır: `--k-blue-500 → #4aa8ff`

### 8.5 Hareket/animasyon
- Sayfa geçişleri: 200ms `ease-out` fade
- Hover: kart border `#cfd6e2` + `translateY(-1px)` + shadow boost
- Tug bar rope marker: oy gelince yumuşak `transform: translateX()` transition

### 8.6 Erişilebilirlik
- Tüm interaktif elementler keyboard-focusable, `focus-visible` ring (2px `var(--k-blue-400)`, offset 2px)
- Side chip'lerde sadece renk değil emoji + label da var (renk körü için güvenli)
- Alt text tüm avatar'larda

### 8.7 Responsive breakpoint'ler (Tailwind default)
- `sm:` 640px — bottom-nav kalır, içerik dolu
- `md:` 768px — feed daha geniş
- `lg:` 1024px — desktop sidebar + right rail beraber
- `xl:` 1280px — tam 3 kolonlu desktop

### 8.8 Karakteristik mikro detaylar
- Mode chip emoji + dot — emoji yoksa sadece dot (kodbaza göre adapt et)
- Rank emoji (🥚⚔️🏆👑) — kullanıcı seviyesine göre
- Streak fire emoji animasyonu (opsiyonel — `transform: scale(1) → scale(1.1)` 800ms ease infinite alternate)

---

## 9. Implementation Sırası (Önerilen)

1. **Token foundation** (en önce — diğer her şey buna dayanıyor)
   - `globals.css` + `tailwind.config.ts` güncelle
   - `components/ui/SideChip.tsx` ekle
   - `TugBar.tsx` ekle
2. **Feed + Home**
   - `DuelFeedCard.tsx` v3 stiline çek
   - `TodayScenarioHero.tsx` yarat ve `app/oyun/page.tsx`'e koy
3. **Detail / Arena**
   - 2 kolonlu Arena layout
   - Mobile toggle
4. **Liderlik**
   - Podium component
   - Tablo refactor
5. **Profil**
   - Hero + stats grid + achievement strip + tabs
6. **Keşfet**
   - Featured card + categories grid
7. **Shell güncellemeleri**
   - Sol sidebar aktif state stilleri
   - Bottom-nav pill highlight
   - FAB gradient + transform
8. **Detaylar**
   - Loading/empty/error state'leri
   - Erişilebilirlik kontrolü
   - Dark mode (opsiyonel)

---

## 10. Dosya Listesi (Bu paketteki)

| Dosya | İçerik |
|---|---|
| `Kapisio Redesign v3.html` | Ana prototip — desktop + mobile artboard'lar |
| `tokens.css` | v1'den miras token'lar (mavi, mod renkleri vb.) |
| `tokens-v3.css` | v3 eklemeleri (warm, surface, k3-h-1 vb.) |
| `components.jsx` | Icons, Avatar, ModeChip, RankPill — paylaşılan |
| `data.jsx` | Mock data (kullanıcı, senaryolar, cevaplar, leaderboard) |
| `screens-v3.jsx` | Tüm v3 ekran component'leri |
| `shells-v3.jsx` | Desktop + Mobile shell |
| `screens-v1-reference.jsx` | v1'in versiyonu — referans için |
| `screens-extra-v1-reference.jsx` | Mesajlar/Arşiv/Settings/Saved — v1, v3 için aynen kalır |
| `tweaks-panel.jsx` | Tweaks UI (handoff için gerekli değil) |
| `design-canvas.jsx` | Artboard renderer (handoff için gerekli değil) |

---

## 11. Açık Sorular (Implementation sırasında karar verilecek)

1. **Cevap oylama** — Reddit-style ↑/↓ mı yoksa tek heart/like mı? Mockup ↑/↓ gösteriyor, mevcut `VoteButton.tsx` ile uyumlu.
2. **Düello çağrı flow'u** — Cevap kartında "Düello" tıklayınca: kim? Modal mı, sheet mi, route mı? `RematchButton.tsx`'e bak.
3. **Achievement data source** — Şu an mock. `app/api/missions/` veya `app/api/seasons/` content burada görünür mu?
4. **"SEN" rozeti** — Liderlik tablosunda kendini vurgulama; `auth.getUser()` ile `current_user_id === row.user_id` karşılaştırması.

---

## Notlar

- Mockup'ta gördüğün tüm Türkçe copy (Sıcak, Soğuk, Düello, Cevabını yaz, Senaryo Oluştur, vb.) korunmalı — değiştirme
- Kapisio'nun mevcut "Yaz. Kapış. Kazan." marka enerjisi mockup'a yerleştirildi — buton ve manşet copy'lerinde
- Bu paket prototipin "v3" sürümünden çıktı — proje root'ta `Kapisio Redesign v3.html` olarak duruyor, gerekirse `npx serve` ile aç
