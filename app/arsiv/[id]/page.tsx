export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ScenarioCard from '@/components/scenarios/ScenarioCard'
import VoteButton from '@/components/answers/VoteButton'
import ReactionBar from '@/components/reactions/ReactionBar'
import FriendChallengeButton from '@/components/challenge/FriendChallengeButton'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('scenarios').select('content, answer_count').eq('id', params.id).single()
  if (!data) return { title: 'Senaryo · Kapisio' }
  const title = `"${data.content.slice(0, 80)}"${data.content.length > 80 ? '...' : ''}`
  const desc = `${data.answer_count ?? 0} kişi cevapladı. Sen de cevapla ve düello yap!`
  return {
    title: `${title} · Kapisio`,
    description: desc,
    openGraph: {
      title: `Kapisio · Senaryo`,
      description: `"${data.content.slice(0, 120)}" — ${desc}`,
      siteName: 'Kapisio',
    },
    twitter: { card: 'summary_large_image', title: `Kapisio Senaryosu`, description: desc },
  }
}

export default async function ScenarioDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scenario } = await supabase
    .from('scenarios')
    .select(`
      id, content, category, active_date, answer_count, created_at, is_user_created, is_approved,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('id', params.id)
    .eq('is_approved', true)
    .single()

  if (!scenario) notFound()

  const { data: answers } = await supabase
    .from('answers')
    .select(`
      id, content, vote_count, created_at,
      user:profiles!answers_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('scenario_id', params.id)
    .order('vote_count', { ascending: false })
    .limit(50)

  let userAnswer = null
  if (user) {
    const { data } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('scenario_id', params.id)
      .maybeSingle()
    userAnswer = data
  }

  const enrichedScenario = { ...scenario as any, answered: !!userAnswer }

  // Find user's own answer (for friend challenge button)
  const ownAnswer = user && userAnswer
    ? (answers ?? []).find((a: any) => a.id === userAnswer.id) ?? null
    : null

  return (
    <div className="min-h-screen bg-[#0f0f1a] pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Back */}
        <Link
          href="/arsiv"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-4 transition-colors"
        >
          ← Arşive dön
        </Link>

        {/* Scenario card with answer form */}
        <ScenarioCard
          scenario={enrichedScenario}
          userId={user?.id ?? null}
          showAnswer={!userAnswer}
        />

        {/* Friend challenge — shown when user has answered */}
        {user && ownAnswer && (
          <div className="mt-3 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Arkadaşına Meydan Oku</p>
            <FriendChallengeButton
              scenarioId={(scenario as any).id}
              answerId={ownAnswer.id}
              userId={user.id}
            />
          </div>
        )}

        {/* Answers */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">
            {(answers ?? []).length} Cevap
          </h2>

          {(answers ?? []).length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <div className="text-3xl mb-2">🤫</div>
              <p>Henüz cevap yok. İlk cevaplayan sen ol!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(answers ?? []).map((answer: any, i: number) => (
                <div
                  key={answer.id}
                  className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/30 text-sm font-mono w-5 shrink-0 mt-0.5">
                      #{i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {answer.user?.avatar_url ? (
                          <img
                            src={answer.user.avatar_url}
                            alt={answer.user.display_name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-violet-500/30 flex items-center justify-center text-xs text-white">
                            {answer.user?.display_name?.[0] ?? '?'}
                          </div>
                        )}
                        <Link
                          href={`/profil/${answer.user?.username}`}
                          className="text-sm font-medium text-white/80 hover:text-violet-400 transition-colors"
                        >
                          {answer.user?.display_name ?? 'Anonim'}
                        </Link>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed mb-3">{answer.content}</p>
                      <ReactionBar answerId={answer.id} userId={user?.id ?? null} compact />
                    </div>
                    <VoteButton
                      answerId={answer.id}
                      initialVotes={answer.vote_count}
                      userId={user?.id ?? null}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
