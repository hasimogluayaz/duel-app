# Handoff: Kapisio Redesign

## Overview
Kapisio — günlük senaryo / tartışma platformu. Reddit + Twitter + günlük soru kombinasyonu. Kullanıcılar günün senaryosuna cevap yazar, başkalarıyla "düello" yapar, topluluk oylar.

## About the Design Files
Bu pakettekiler **HTML/React tabanlı tasarım referanslarıdır** — pixel-perfect mockup'lar. Production kodu değildir. Hedef codebase'inizdeki framework (React/Vue/SwiftUI/native) ve mevcut design system'le yeniden implemente edilmelidir.

## Fidelity
**High-fidelity (hifi)** — Renkler, tipografi, spacing ve etkileşimler nihai. Pixel-perfect yeniden üretilebilir.

## Screens / Views
1. **Anasayfa** — Feed + günün senaryosu hero, mod chip tabs, aktif düellolar, üst cevaplar.
2. **Senaryo Detay** — Reddit-stili upvote, Sıcak/Soğuk taraf seçimi, cevap composer, yorumlar.
3. **Keşfet** — Kategori grid + yükselen senaryolar listesi.
4. **Bildirimler** — Kategorize bildirim feed'i (düello/oy/bahsetme/takip).
5. **Profil** — Banner + stats grid + sekme bazlı içerik (Vitrin/Genel/Düellolar/Cevaplar).
6. **Liderlik** — Podyum top 3 + ranked list.
7. **Mesajlar** — DM listesi + thread (online dot, düello davet kartı).
8. **Arşiv** — Geçmiş senaryolar, filtre (Kazandın/Kaybettin/Cevapsız).
9. **Kaydettiklerim** — Koleksiyon tile'ları + sekme bazlı liste.
10. **Ayarlar** — Tema seçimi + toggle'larla bildirim/gizlilik/hesap.

## Layout
- **Desktop**: 280px sidebar + 720px center feed + 320px right rail. Sticky top utilities.
- **Mobile**: 54px sticky top bar (logo+search+msg+bell) + scroll content + 64px bottom tab bar (Anasayfa/Keşfet/[+FAB]/Profil/Daha). "Daha" tab bottom sheet açar.

## Design Tokens

### Renk Paleti (Sadece Mavi Aile)
- **Primary**: `#2a6cf0` (logo mavisi)
- **Sky**: `#1f8df0` / `#4aa8ff` — açık mavi aksan
- **Navy**: `#1c2f6e` / `#1442a8` / `#0a1f55` — derin mavi
- **Slate** (chrome): 50 #f7f8fa, 100 #eef0f4, 200 #d6dae3, 500 #646c7e, 900 #0f1320
- **Surface**: bg #f7f8fa, elev #ffffff, border #e4e7ed
- **Text**: 1° #0f1320, 2° #464d5c, 3° #8e96a6
- **Semantik**: success #16a34a, danger #dc2626

### Mod Renkleri (Hepsi Mavi Tonu)
- Senaryo: #2a6cf0 (primary)
- Emoji: #4aa8ff (sky)
- Karakter: #1442a8 (deep navy)
- Tartışma: #1c2f6e (darkest navy)

### Tipografi
- **Sans**: Geist (system fallback)
- **Mono**: Geist Mono (sayılar, timestamp)
- Başlık scale: 22px / 18px / 16px, letter-spacing -0.02em
- Body: 14-15px / 1.4

### Spacing & Shape
- Radii: 6 / 10 / 14 / 20 / pill(999)
- Shadows: sm/md/lg/pop (tokens.css'te tanımlı)

## Interactions & Behavior
- Tüm nav linkleri shared state (`useAppState`) ile çalışır.
- Mobile "Daha" tab → bottom sheet (slideUp animasyon).
- Mesajlar mobilde liste↔thread arası geçiş; desktop'ta yan yana.
- Vote rail: up/down/null state, optimistic counter update.
- Theme toggle (Açık/Koyu/Sistem) UI'da var; logic bağlanmalı.

## State Management
- `screen` (string) — aktif route.
- `creating` (bool) — yeni senaryo modal.
- Vote state per answer (myVote, score).
- Tab state per screen (filter, active collection, theme, etc.).

## Files
- `Kapisio Redesign.html` — entry point, router, shells render.
- `tokens.css` — design tokens (renk/tipo/spacing).
- `components.jsx` — Icons, Avatar, KapisioLogo, ModeBadge, VoteRail, AnswerCard, ScenarioCard, ChipTab, SectionTitle.
- `data.jsx` — Mock data (feed, leaderboard, notifications, user).
- `screens.jsx` — Home, Detail, Discover, Leaderboard, Notifications, Profile, CreateModal.
- `screens-extra.jsx` — Messages, Archive, Saved, Settings.
- `shell-desktop.jsx` — Desktop sidebar+rail layout.
- `shell-mobile.jsx` — Mobile top bar + bottom tabs + More sheet.

## Notes for Implementer
- Tasarım sadece mavi paleti kullanıyor — coral/turuncu/mor/yeşil renkleri kaldırıldı.
- `Geist` fontunu Vercel'in CDN'inden veya npm `geist` paketinden yükleyin.
- İkonlar inline SVG (24x24 viewBox, 1.6 stroke-width). Lucide veya tabler-icons ile değiştirilebilir.
- Mock data `data.jsx`'te — gerçek API ile değiştirilmelidir.
