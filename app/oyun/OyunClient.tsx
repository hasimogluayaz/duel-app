'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { validateAnswer } from '@/lib/utils/validation'
import { timeAgo, formatPoints } from '@/lib/utils/formatting'
import type { Profile, Scenario, Answer } from '@/types'
import { Swords, Search, ExternalLink, Clock, CheckCircle, Star, Flame, Trophy, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Props {
  scenario: Scenario | null
  profile: Profile | null
  userAnswer: Answer | null
  activeDuels: any[]
  userId: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Gece geç saatlerde de burada 🌙'
  if (h < 12) return 'Günaydın ☀️'
  if (h < 18) return 'İyi günler 👋'
  return 'İyi akşamlar 🌆'
}

export function OyunClient({ scenario, profile, userAnswer: initialAnswer, activeDuels, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userAnswer, setUserAnswer] = useState(initialAnswer)
  const [duelModal, setDuelModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)

  async function submitAnswer() {
    if (!scenario) return
    const validation = validateAnswer(answer)
    if (!validation.valid) {
      toast(validation.error!, 'error')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario.id, content: answer }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Cevap kaydedilemedi.', 'error')
      setSubmitting(false)
      return
    }

    setUserAnswer(json.answer)
    toast('Cevabın kaydedildi! +5 puan 🎉', 'success')
    setSubmitting(false)
    router.refresh()
  }

  async function searchUsers(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }

    setSearchLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${q}%`)
      .neq('id', userId)
      .eq('is_admin', false)
      .eq('is_banned', false)
      .limit(8)

    setSearchResults((data as Profile[]) ?? [])
    setSearchLoading(false)
  }

  async function inviteUser(targetId: string) {
    if (!scenario || !userAnswer) return
    setInviting(targetId)

    const res = await fetch('/api/duel/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenged_id: targetId,
        scenario_id: scenario.id,
        challenger_answer_id: userAnswer.id,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      toast(json.error || 'Davet gönderilemedi.', 'error')
      setInviting(null)
      return
    }

    toast('Düello daveti gönderildi! ⚔️', 'success')
    setDuelModal(false)
    setInviting(null)
    router.push(`/duel/${json.duel.share_token}`)
  }

  const charPercent = Math.round((answer.length / 280) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* ── Welcome hero ─────────────────────────────── */}
      {profile && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/20 p-5">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-purple-500/10" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-pink-500/10" />

          <div className="relative flex items-center gap-4">
            <Link href={`/profil/${profile.username}`}>
              <Avatar
                src={profile.avatar_url}
                username={profile.username}
                size="lg"
                className="ring-2 ring-purple-500/40 hover:ring-purple-400/80 transition-all"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-fg-muted leading-none mb-1">{getGreeting()}</p>
              <h2 className="text-xl font-black text-fg truncate">
                {profile.display_name || profile.username}
              </h2>
              {profile.personality_type && (
                <Badge variant="info" className="mt-1.5 text-xs">🧠 {profile.personality_type}</Badge>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center hidden sm:block">
                <div className="text-lg font-black text-fg">{formatPoints(profile.total_points)}</div>
                <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                  <Star size={9} className="text-amber-400 fill-amber-400" />
                  puan
                </div>
              </div>
              {profile.streak_count > 0 && (
                <div className="text-center">
                  <div className="text-lg font-black text-amber-400">{profile.streak_count}</div>
                  <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                    <Flame size={9} className="text-amber-400" />
                    seri
                  </div>
                </div>
              )}
              {activeDuels.length > 0 && (
                <div className="text-center">
                  <div className="text-lg font-black text-purple-400">{activeDuels.length}</div>
                  <div className="flex items-center gap-0.5 justify-center text-xs text-fg-subtle">
                    <Swords size={9} className="text-purple-400" />
                    aktif
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Today's scenario ─────────────────────────── */}
      {!scenario ? (
        <Card className="text-center py-14">
          <p className="text-5xl mb-4">🌙</p>
          <h2 className="text-xl font-bold text-fg mb-2">Bugünkü senaryo hazırlanıyor</h2>
          <p className="text-fg-subtle text-sm">Birazdan yeni senaryo yayınlanacak.</p>
        </Card>
      ) : (
        <Card glow>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="info" className="flex items-center gap-1.5">
              <Sparkles size={11} />
              Günün Senaryosu
            </Badge>
            <span className="text-xs text-fg-subtle">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <p className="text-xl font-bold text-fg leading-relaxed">{scenario.content}</p>
        </Card>
      )}

      {/* ── Answer section ───────────────────────────── */}
      {scenario && (
        userAnswer ? (
          <Card className="border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={13} className="text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-400">Cevabın kaydedildi · +5 puan</span>
            </div>
            <blockquote className="text-fg bg-bg rounded-xl p-4 leading-relaxed border-l-2 border-green-500/30 text-sm">
              {userAnswer.content}
            </blockquote>
            <div className="mt-4">
              <Button onClick={() => setDuelModal(true)} className="w-full btn-gradient">
                <Swords size={16} />
                Arkadaşını Düelloya Çağır ⚔️
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Send size={16} className="text-purple-400" />
              <h3 className="text-base font-bold text-fg">Cevabını Yaz</h3>
            </div>
            <Textarea
              placeholder="Cevabını buraya yaz... Özgün, eğlenceli veya dürüst — seçim senin."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={4}
              maxLength={280}
              charCount={answer.length}
              maxChars={280}
            />
            {/* Character bar */}
            <div className="mt-2 h-1 rounded-full bg-stroke overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  charPercent > 90 ? 'bg-red-500' : charPercent > 70 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
            <Button
              onClick={submitAnswer}
              loading={submitting}
              disabled={answer.trim().length === 0}
              className="w-full mt-4 btn-gradient"
              size="lg"
            >
              Cevapla ve +5 puan kazan
            </Button>
          </Card>
        )
      )}

      {/* ── Active duels ─────────────────────────────── */}
      {activeDuels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-fg flex items-center gap-2">
              <Swords size={16} className="text-purple-400" />
              Aktif Düellolar
              <span className="text-xs font-normal bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {activeDuels.length}
              </span>
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {activeDuels.map((duel: any) => {
              const isChallenger = duel.challenger_id === userId
              const opponent = isChallenger ? duel.challenged : duel.challenger
              return (
                <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                  <Card className="hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-fg group-hover:text-purple-300 transition-colors">
                            vs {opponent?.display_name || opponent?.username}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {duel.status === 'pending' && <Badge variant="warning">Kabul Bekleniyor</Badge>}
                            {duel.status === 'active' && <Badge variant="info">Oylanıyor</Badge>}
                            {duel.status === 'completed' && (
                              <Badge variant={duel.winner_id === userId ? 'success' : 'danger'}>
                                {duel.winner_id === userId ? '🏆 Kazandın!' : 'Kaybettin'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
                        <Clock size={11} />
                        {timeAgo(duel.created_at)}
                        <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state when no active duels and answer submitted */}
      {activeDuels.length === 0 && userAnswer && (
        <Card className="text-center py-10 border-dashed">
          <Trophy size={32} className="text-fg-subtle mx-auto mb-3" />
          <p className="text-fg font-semibold mb-1">Aktif düello yok</p>
          <p className="text-fg-subtle text-sm mb-4">Birini düelloya çağır ve topluluğun oylamasına sun!</p>
          <Button onClick={() => setDuelModal(true)} variant="secondary" size="sm">
            <Swords size={14} />
            Düelloya Çağır
          </Button>
        </Card>
      )}

      {/* ── Duel invite modal ────────────────────────── */}
      <Modal open={duelModal} onClose={() => setDuelModal(false)} title="Düelloya Çağır ⚔️">
        <p className="text-sm text-fg-muted mb-4">
          Hangi kullanıcıyı düelloya çağırmak istiyorsun? Cevaplarınız topluluk tarafından oylanacak.
        </p>
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            type="text"
            placeholder="Kullanıcı adı ara..."
            value={searchQuery}
            onChange={e => searchUsers(e.target.value)}
            className="w-full bg-bg border border-stroke rounded-xl pl-9 pr-4 py-2.5 text-fg placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>

        {searchLoading && (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="flex flex-col gap-2">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-stroke hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar_url} username={user.username} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-fg">{user.display_name || user.username}</p>
                    <p className="text-xs text-fg-subtle">@{user.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  loading={inviting === user.id}
                  onClick={() => inviteUser(user.id)}
                >
                  Davet Et
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
          <div className="text-center py-6">
            <p className="text-fg-subtle text-sm">Kullanıcı bulunamadı.</p>
          </div>
        )}

        {searchQuery.length === 0 && (
          <div className="text-center py-4">
            <p className="text-fg-subtle text-xs">En az 2 karakter yaz</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
