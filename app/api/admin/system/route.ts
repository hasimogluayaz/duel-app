import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// List of expected env vars and their purpose
const ENV_VARS = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', purpose: 'Supabase URL', critical: true },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', purpose: 'Supabase anon key', critical: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', purpose: 'Supabase service role (admin/cron)', critical: true },
  { name: 'CRON_SECRET', purpose: 'Vercel cron auth', critical: true },
  { name: 'GROQ_API_KEY', purpose: 'AI scenario + judge', critical: true },
  { name: 'NEXT_PUBLIC_APP_URL', purpose: 'Public site URL (share links)', critical: false },
  { name: 'RESEND_API_KEY', purpose: 'Email notifications', critical: false },
  { name: 'STRIPE_SECRET_KEY', purpose: 'Premium billing', critical: false },
  { name: 'STRIPE_WEBHOOK_SECRET', purpose: 'Stripe webhook verification', critical: false },
  { name: 'STRIPE_PREMIUM_PRICE_ID', purpose: 'Premium plan price ID', critical: false },
  { name: 'UPSTASH_REDIS_REST_URL', purpose: 'Rate limiting', critical: false },
  { name: 'UPSTASH_REDIS_REST_TOKEN', purpose: 'Rate limiting auth', critical: false },
  { name: 'NEXT_PUBLIC_POSTHOG_KEY', purpose: 'Analytics', critical: false },
  { name: 'SENTRY_DSN', purpose: 'Error tracking', critical: false },
]

// Vercel cron jobs (mirrors vercel.json)
const CRON_JOBS = [
  { path: '/api/scenario/generate', schedule: '1 21 * * *', label: 'Günlük senaryo üret (TR 00:01)' },
  { path: '/api/scenario/generate', schedule: '0 6 * * *', label: 'Senaryo safety-net (TR 09:00)' },
  { path: '/api/cron/weekly-reset', schedule: '0 21 * * 0', label: 'Haftalık reset' },
  { path: '/api/cron/streak-reset', schedule: '0 22 * * *', label: 'Streak reset' },
  { path: '/api/cron/season-end', schedule: '0 23 * * *', label: 'Sezon sonu' },
  { path: '/api/cron/daily-reminder', schedule: '0 17 * * *', label: 'Günlük hatırlatma' },
  { path: '/api/cron/daily-email', schedule: '5 3 * * *', label: 'Günlük email' },
  { path: '/api/cron/weekly-digest', schedule: '0 8 * * 1', label: 'Haftalık özet emaili' },
  { path: '/api/cron/cleanup-stories', schedule: '0 4 * * *', label: 'Story temizliği' },
  { path: '/api/cron/premium-maintenance', schedule: '0 6 * * *', label: 'Premium bakım (expire + freeze)' },
]

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Env var presence
  const envStatus = ENV_VARS.map(v => ({
    ...v,
    set: !!process.env[v.name],
  }))

  // Table row counts — every major table
  const tableCounts = await Promise.all([
    'profiles', 'answers', 'scenarios', 'duels', 'duel_participants',
    'answer_likes', 'comments', 'followers', 'messages', 'notifications',
    'reports', 'push_subscriptions', 'achievements', 'subscriptions',
  ].map(async (table) => {
    try {
      const { count } = await service.from(table).select('*', { count: 'exact', head: true })
      return { table, count: count ?? 0, ok: true }
    } catch (e: any) {
      return { table, count: 0, ok: false, error: e.message }
    }
  }))

  // Storage avatar size (best effort, skip on error)
  let avatarBucketSize: { count: number; bytes: number } | null = null
  try {
    const { data: files } = await service.storage.from('avatars').list('', { limit: 1000 })
    const total = (files ?? []).reduce((s: number, f: any) => s + (f.metadata?.size ?? 0), 0)
    avatarBucketSize = { count: files?.length ?? 0, bytes: total }
  } catch {}

  // Latest scenario generation timestamp (rough proxy for cron health)
  const { data: lastScenario } = await service
    .from('scenarios')
    .select('active_date, generated_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  // Last user signup (proxy for live traffic)
  const { data: lastUser } = await service
    .from('profiles')
    .select('created_at, username')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Last answer
  const { data: lastAnswer } = await service
    .from('answers')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    env: envStatus,
    crons: CRON_JOBS,
    tables: tableCounts,
    storage: { avatars: avatarBucketSize },
    pulse: {
      lastScenarioGeneratedAt: lastScenario ? (lastScenario as any).generated_at : null,
      lastScenarioDate: lastScenario ? (lastScenario as any).active_date : null,
      lastUserAt: lastUser ? (lastUser as any).created_at : null,
      lastUserName: lastUser ? (lastUser as any).username : null,
      lastAnswerAt: lastAnswer ? (lastAnswer as any).created_at : null,
    },
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      now: new Date().toISOString(),
    },
  })
}

// POST /api/admin/system — manual trigger of a cron
export async function POST(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path } = await req.json() as { path?: string }
  if (!path || !CRON_JOBS.find(c => c.path === path)) {
    return NextResponse.json({ error: 'Geçersiz cron yolu.' }, { status: 400 })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET set değil.' }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL ?? 'kapisio.com'}`

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    })
    const text = await res.text()
    return NextResponse.json({ status: res.status, ok: res.ok, body: text.slice(0, 1000) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
