export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ScenarioCard from '@/components/scenarios/ScenarioCard'
import ScenarioComments from '@/components/scenarios/ScenarioComments'
import VoteButton from '@/components/answers/VoteButton'
import ReactionBar from '@/components/reactions/ReactionBar'
import FriendChallengeButton from '@/components/challenge/FriendChallengeButton'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import AnswerComments from '@/components/answers/AnswerComments'
import EditAnswerButton from '@/components/answers/EditAnswerButton'
import { ReportButton } from '@/components/ui/ReportButton'
import DeleteAnswerButton from '@/components/answers/DeleteAnswerButton'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowLeft } from 'lucide-react'
import { timeAgo } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils/cn'

interface Props {
  params: { id: string }
  searchParams: { sort?: string }
}

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

export default async function ScenarioDetailPage({ params, searchParams }: Props) {
  const answerSort = searchParams.sort === 'recent' ? 'recent' : 'popular'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scenario } = await supabase
    .from('scenarios')
    .select(`
      id, content, category, active_date, answer_count, comment_count, upvotes, generated_at,
      is_user_created, is_approved, tags, debate_question, scenario_type, user_id,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('id', params.id)
    .eq('is_approved', true)
    .single()

  if (!scenario) notFound()

  const { data: answers } = await supabase
    .from('answers')
    .select(`
      id, content, vote_count, created_at, edit_count,
      user:profiles!answers_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('scenario_id', params.id)
    .eq('is_hidden', false)
    .order(answerSort === 'recent' ? 'created_at' : 'vote_count', { ascending: false })
    .limit(50)

  let userAnswer = null
  let initialUpvoted = false

  if (user) {
    const [{ data: ua }, { data: uv }] = await Promise.all([
      supabase
        .from('answers')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario_id', params.id)
        .maybeSingle(),
      (supabase as any)
        .from('scenario_votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario_id', params.id)
        .maybeSingle(),
    ])
    userAnswer = ua
    initialUpvoted = !!uv
  }

  const isOwnScenario = !!(user && (scenario as any).user_id === user.id)
  const enrichedScenario = { ...(scenario as any), answered: !!userAnswer }
  const ownAnswer = user && userAnswer
    ? (answers ?? []).find((a: any) => a.id === userAnswer.id) ?? null
    : null

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Back */}
        <Link
          href="/kesfet"
          className="inline-flex items-center gap-2 text-fg-subtle hover:text-fg text-sm mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          Keşfete dön
        </Link>

        {/* Scenario card — detail mode with answer form */}
        <ScenarioCard
          scenario={enrichedScenario}
          userId={user?.id ?? null}
          mode="detail"
          initialUpvoted={initialUpvoted}
          showAnswer={!userAnswer}
          isOwnScenario={isOwnScenario}
        />

        {/* Friend challenge — shown when user has answered */}
        {user && ownAnswer && (
          <div className="mt-3 bg-surface border border-stroke rounded-2xl p-4">
            <p className="text-xs text-fg-subtle mb-2 font-semibold uppercase tracking-wider">⚔️ Arkadaşına Meydan Oku</p>
            <FriendChallengeButton
              scenarioId={(scenario as any).id}
              answerId={ownAnswer.id}
              userId={user.id}
            />
          </div>
        )}

        {/* Answers */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider">
              {(answers ?? []).length} Cevap
            </h2>
            <div className="flex bg-surface-2 border border-stroke rounded-xl p-0.5 gap-0.5">
              {(['popular', 'recent'] as const).map(s => (
                <Link
                  key={s}
                  href={`/arsiv/${params.id}?sort=${s}`}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    answerSort === s
                      ? 'bg-surface text-fg border border-stroke shadow-sm'
                      : 'text-fg-subtle hover:text-fg'
                  )}
                >
                  {s === 'popular' ? '🔥 Popüler' : '🕐 Yeni'}
                </Link>
              ))}
            </div>
          </div>

          {(answers ?? []).length === 0 ? (
            <div className="text-center py-14 text-fg-subtle bg-surface border border-stroke rounded-2xl">
              <div className="text-3xl mb-2">🤫</div>
              <p className="font-medium">Henüz cevap yok. İlk cevaplayan sen ol!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(answers ?? []).map((answer: any, i: number) => (
                <div
                  key={answer.id}
                  className="bg-surface border border-stroke rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 text-fg-subtle/40 text-xs font-mono mt-1 w-5 shrink-0">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Answer author */}
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/profil/${answer.user?.username}`}>
                          <Avatar src={answer.user?.avatar_url} username={answer.user?.username ?? '?'} size="xs" />
                        </Link>
                        <Link
                          href={`/profil/${answer.user?.username}`}
                          className="text-sm font-semibold text-fg hover:text-primary transition-colors"
                        >
                          {answer.user?.display_name ?? answer.user?.username ?? 'Anonim'}
                        </Link>
                        <span className="text-xs text-fg-subtle">{timeAgo(answer.created_at)}</span>
                      </div>

                      <p className="text-fg text-sm leading-relaxed mb-3">{answer.content}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <ReactionBar answerId={answer.id} userId={user?.id ?? null} compact />
                        {user && <BookmarkButton type="answer" id={answer.id} size={13} showLabel />}
                        {user && (answer as any).user?.id !== user.id && (
                          <ReportButton targetType="answer" targetId={answer.id} userId={user.id} />
                        )}
                        {user && (answer as any).user?.id === user.id && (
                          <>
                            <EditAnswerButton
                              answerId={answer.id}
                              initialContent={answer.content}
                              editCount={(answer as any).edit_count ?? 0}
                              createdAt={answer.created_at}
                            />
                            <DeleteAnswerButton answerId={answer.id} />
                          </>
                        )}
                      </div>
                      <AnswerComments answerId={answer.id} currentUserId={user?.id ?? null} />
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

        {/* Scenario-level comments */}
        <ScenarioComments scenarioId={params.id} userId={user?.id ?? null} />
      </div>
    </div>
  )
}
