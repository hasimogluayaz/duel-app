import { Resend } from 'resend'

// Lazy init — RESEND_API_KEY may not be set during build
let _resend: Resend | null = null
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = 'Kapisio <bildirim@kapisio.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kapisio.com'

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kapisio</title>
<style>
  body { margin:0; padding:0; background:#0d0b1e; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#e2e8f0; }
  .wrap { max-width:520px; margin:0 auto; padding:32px 16px; }
  .logo { font-size:22px; font-weight:900; color:#fff; margin-bottom:24px; }
  .logo span { color:#a78bfa; }
  .card { background:#13112a; border:1px solid #2d2b4e; border-radius:16px; padding:28px; margin-bottom:20px; }
  .btn { display:inline-block; background:linear-gradient(135deg,#7c3aed,#db2777); color:#fff !important; text-decoration:none; font-weight:700; border-radius:12px; padding:12px 28px; font-size:15px; margin-top:16px; }
  .footer { text-align:center; font-size:12px; color:#64748b; margin-top:24px; }
  .footer a { color:#6366f1; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">⚔️ <span>Kapisio</span></div>
  ${content}
  <div class="footer">
    Kapisio'dan vazgeçmek mi istiyorsun? <a href="${APP_URL}/profil/ayarlar">Bildirimleri kapat</a>
  </div>
</div>
</body>
</html>`
}

export async function sendDailyScenarioEmail(opts: {
  to: string
  username: string
  scenario: string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: '⚔️ Bugünkü Kapisio senaryosu yayında!',
    html: base(`
      <div class="card">
        <p style="font-size:13px;color:#a78bfa;font-weight:700;margin:0 0 12px">Günlük Senaryo</p>
        <p style="font-size:18px;font-weight:700;margin:0 0 20px;line-height:1.5">"${opts.scenario}"</p>
        <p style="color:#94a3b8;font-size:14px;margin:0">Merhaba ${opts.username}! Bugünkü senaryo hazır. Cevabını yaz, düelloya gir, puan kazan.</p>
        <a href="${APP_URL}/oyun" class="btn">Şimdi Oyna →</a>
      </div>
    `),
  })
}

export async function sendDuelInviteEmail(opts: {
  to: string
  username: string
  challengerName: string
  duelUrl: string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `⚔️ ${opts.challengerName} seni düelloya çağırdı!`,
    html: base(`
      <div class="card">
        <p style="font-size:24px;font-weight:900;margin:0 0 12px">${opts.challengerName} seni düelloya çağırdı! ⚔️</p>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px">Merhaba ${opts.username}!</p>
        <p style="color:#94a3b8;font-size:14px;margin:0">Düelloyu kabul et ve topluluğun oylarını topla. Kazanan 50 puan alır!</p>
        <a href="${opts.duelUrl}" class="btn">Düelloyu Gör →</a>
      </div>
    `),
  })
}

export async function sendDuelResultEmail(opts: {
  to: string
  username: string
  won: boolean
  verdict: string
  duelUrl: string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.won ? '🏆 Düelloyu kazandın!' : '😅 Düello sonuçlandı',
    html: base(`
      <div class="card">
        <p style="font-size:24px;font-weight:900;margin:0 0 12px">${opts.won ? '🏆 Tebrikler, kazandın!' : '😅 Bu sefer olmadı'}</p>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 12px">Merhaba ${opts.username}!</p>
        <div style="background:#0d0b1e;border:1px solid #2d2b4e;border-radius:12px;padding:16px;margin-bottom:12px">
          <p style="font-size:13px;color:#fbbf24;font-style:italic;margin:0">🤖 "${opts.verdict}"</p>
        </div>
        <a href="${opts.duelUrl}" class="btn">${opts.won ? 'Sonuçları Gör →' : 'Düelloyu İzle →'}</a>
      </div>
    `),
  })
}

export async function sendWeeklyDigestEmail(opts: {
  to: string
  username: string
  scenarios: Array<{ content: string; answer_count: number; id: string }>
}) {
  const resend = getResend()
  if (!resend) return
  const scenarioItems = opts.scenarios.map((s, i) =>
    `<div style="margin-bottom:12px;padding:12px;background:#0d0b1e;border:1px solid #2d2b4e;border-radius:10px">
      <span style="font-size:12px;color:#a78bfa;font-weight:700;">#${i + 1}</span>
      <p style="font-size:14px;font-weight:600;margin:4px 0;">"${s.content.slice(0, 100)}${s.content.length > 100 ? '...' : ''}"</p>
      <a href="${APP_URL}/arsiv/${s.id}" style="font-size:12px;color:#6366f1;text-decoration:none;">${s.answer_count} cevap →</a>
    </div>`
  ).join('')
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: '📊 Bu haftanın en çok konuşulan senaryoları',
    html: base(`
      <div class="card">
        <p style="font-size:22px;font-weight:900;margin:0 0 16px">Bu hafta neler konuşuldu? 🗳️</p>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 20px">Merhaba ${opts.username}! İşte bu haftanın en popüler senaryoları:</p>
        ${scenarioItems}
        <a href="${APP_URL}/kesfet" class="btn">Tümünü Keşfet →</a>
      </div>
    `),
  })
}

export async function sendStreakReminderEmail(opts: {
  to: string
  username: string
  streakCount: number
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `🔥 Sertin tehlikede! (${opts.streakCount} günlük seri)`,
    html: base(`
      <div class="card">
        <p style="font-size:24px;font-weight:900;margin:0 0 12px">🔥 ${opts.streakCount} günlük sertin tehlikede!</p>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 12px">Merhaba ${opts.username}! Bugün oynamadın ve sertin kırılmak üzere.</p>
        <p style="color:#fbbf24;font-size:14px;font-weight:700;margin:0">Hemen oyna ve serini koru!</p>
        <a href="${APP_URL}/oyun" class="btn">Şimdi Oyna →</a>
      </div>
    `),
  })
}
