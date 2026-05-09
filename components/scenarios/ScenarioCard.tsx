'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

interface Scenario {
  id: string
  content: string
  category: string
  active_date: string | null
  answer_count: number
  created_at: string
  is_user_created: boolean
  answered: boolean
  difficulty?: 'easy' | 'medium' | 'hard' | null
  upvote_count?: number
  author?: { username: string; display_name: string; avatar_url: string | null } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  genel: '🌍 Genel',
  ask: '❤️ Aşk',
  is: '💼 İş',
  aile: '👨‍👩‍👧 Aile',
  sosyal: '👥 Sosyal',
  teknoloji: '💻 Teknoloji',
  dunya: '🌏 Dünya',
  mizah: '😂 Mizah',
  felsefe: '🤔 Felsefe',
  spor: '⚽ Spor',
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Kolay',  color: 'text-green-400 bg-green-500/10 border-green-500/20',  emoji: '🟢' },
  medium: { label: 'Orta',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', emoji: '🟡' },
  hard:   { label: 'Zor',    color: 'text-red-400 bg-red-500/10 border-red-500/20',        emoji: '🔴' },
}

interface Props {
  scenario: Scenario
  userId: string | null
  showAnswer?: boolean
}

export default function ScenarioCard({ scenario, userId, showAnswer = false }: Props) {
  const [answered, setAnswered] = useState(scenario.answered)
  const [answer, setAnswer] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [expanded, setExpanded] = useState(showAnswer)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenario.id, content: answer, is_anonymous: isAnonymous }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? 'Bir hata oluştu.')
        return
      }
      setAnswered(true)
      setExpanded(false)
    } catch {
      setSubmitError('Bağlantı hatası.')
    } finally {
      setSubmitting(false)
    }
  }

  const formattedDate = scenario.active_date
    ? new Date(scenario.active_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(scenario.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })

  const diff = scenario.difficulty ? DIFFICULTY_CONFIG[scenario.difficulty] : null

  return (
    <div className={`rounded-2xl border transition-colors ${
      answered
        ? 'bg-[#1a1a2e] border-green-500/20'
        : 'bg-[#1a1a2e] border-white/10 hover:border-white/20'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">
              {CATEGORY_LABELS[scenario.category] ?? scenario.category}
            </span>
            {diff && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${diff.color}`}>
                {diff.emoji} {diff.label}
              </span>
            )}
            {scenario.is_user_created && scenario.author && (
              <Link
                href={`/profil/${scenario.author.username}`}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {scenario.author.avatar_url ? (
                  <Image
                    src={scenario.author.avatar_url}
                    alt={scenario.author.display_name}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-violet-500/30 flex items-center justify-center text-[8px]">
                    {scenario.author.display_name[0]}
                  </div>
                )}
                @{scenario.author.username}
              </Link>
            )}
            <span className="text-xs text-white/30">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {answered && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Cevaplandı</span>
            )}
            <span className="text-xs text-white/30">{scenario.answer_count} cevap</span>
          </div>
        </div>

        {/* Content */}
        <p className="text-white font-medium leading-relaxed">{scenario.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3">
          <Link
            href={`/arsiv/${scenario.id}`}
            className="text-xs text-white/40 hover:text-violet-400 transition-colors"
          >
            Cevapları gör →
          </Link>

          {!answered && userId && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              {expanded ? 'İptal' : 'Cevapla'}
            </button>
          )}

          {!userId && (
            <Link
              href="/giris"
              className="ml-auto text-xs text-white/30 hover:text-violet-400 transition-colors"
            >
              Cevaplamak için giriş yap →
            </Link>
          )}
        </div>

        {/* Answer form */}
        {expanded && !answered && userId && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Cevabını yaz..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:border-violet-500"
              autoFocus
            />

            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                isAnonymous
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                  : 'bg-white/3 border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
              {isAnonymous ? 'Anonim cevap' : 'İsmim görünsün'}
            </button>

            {isAnonymous && (
              <p className="text-xs text-white/30">
                Cevabın anonim paylaşılır. Düello kazanırsan kimliğin açılabilir.
              </p>
            )}

            {submitError && <p className="text-red-400 text-xs">{submitError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || answer.trim().length < 3}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {submitting ? 'Gönderiliyor...' : isAnonymous ? '🎭 Anonim Gönder' : 'Gönder'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
