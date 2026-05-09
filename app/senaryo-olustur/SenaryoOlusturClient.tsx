'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'
import { FileText, Flame, Smile, Mic2, Tag, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { key: 'genel',    emoji: '🌍', label: 'Genel' },
  { key: 'ask',      emoji: '❤️', label: 'Aşk' },
  { key: 'kariyer',  emoji: '💼', label: 'Kariyer' },
  { key: 'aile',     emoji: '👨‍👩‍👧', label: 'Aile' },
  { key: 'sosyal',   emoji: '👥', label: 'Sosyal' },
  { key: 'teknoloji',emoji: '💻', label: 'Teknoloji' },
  { key: 'etik',     emoji: '⚖️', label: 'Etik' },
  { key: 'tartisma', emoji: '🔥', label: 'Tartışma' },
  { key: 'mizah',    emoji: '😂', label: 'Mizah' },
  { key: 'spor',     emoji: '⚽', label: 'Spor' },
  { key: 'felsefe',  emoji: '🤔', label: 'Felsefe' },
  { key: 'dunya',    emoji: '🌏', label: 'Dünya' },
]

const SCENARIO_TYPES = [
  {
    key: 'scenario',
    icon: <FileText size={18} />,
    label: 'Senaryo',
    desc: 'Ne yaparsın? tarzı durumsal sorular',
    placeholder: 'Örn: İş yerinde patronun sana haksız davrandı. Ne yaparsın?',
  },
  {
    key: 'debate',
    icon: <Flame size={18} />,
    label: 'Tartışma',
    desc: 'İki tarafın olduğu debatable sorular',
    placeholder: 'Örn: Sosyal medya gençliği mahvediyor mu?',
  },
  {
    key: 'emoji',
    icon: <Smile size={18} />,
    label: 'Emoji',
    desc: 'Sadece emoji ile yanıt ver',
    placeholder: 'Örn: Sabah uyandığında telefona bakma alışkanlığını emojilerle anlat.',
  },
  {
    key: 'character',
    icon: <Mic2 size={18} />,
    label: 'Karakter',
    desc: 'Bir karakter ol ve o şekilde yanıtla',
    placeholder: 'Örn: Tarihte yaşasaydın, hangi dönemi seçerdin? O dönemdeki biri gibi anlat.',
  },
]

interface Props {
  profile: { username: string; display_name: string | null; avatar_url: string | null; total_points: number } | null
}

export function SenaryoOlusturClient({ profile }: Props) {
  const router = useRouter()
  const toast = useToast()

  const [scenarioType, setScenarioType] = useState('scenario')
  const [category, setCategory] = useState('genel')
  const [content, setContent] = useState('')
  const [debateQuestion, setDebateQuestion] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const selectedType = SCENARIO_TYPES.find(t => t.key === scenarioType)!
  const contentLen = content.length
  const isValid = content.trim().length >= 20

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
    setTagInput('')
  }

  async function submit() {
    if (!isValid) { toast('Senaryo en az 20 karakter olmalı.', 'error'); return }
    setSubmitting(true)

    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim(),
        category,
        scenario_type: scenarioType,
        tags,
        debate_question: scenarioType === 'debate' ? debateQuestion.trim() : undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Senaryo oluşturulamadı.', 'error'); setSubmitting(false); return }

    toast('Senaryonun incelemeye gönderildi! Onaylanınca yayınlanır. +30 puan', 'success')
    router.push('/kesfet?tab=senaryolar')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Back */}
      <Link href="/kesfet" className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg transition-colors">
        <ArrowLeft size={14} />
        Geri
      </Link>

      <div>
        <h1 className="text-xl font-black text-fg">Senaryo Oluştur</h1>
        <p className="text-sm text-fg-subtle mt-0.5">Topluluğa bir soru sun — insanlar cevaplasın</p>
      </div>

      {/* Type selector */}
      <div>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">Tür</p>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setScenarioType(t.key)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                scenarioType === t.key
                  ? 'border-fg/30 bg-surface-2 text-fg'
                  : 'border-stroke bg-surface text-fg-subtle hover:bg-surface-2'
              )}
            >
              <span className={cn('mt-0.5', scenarioType === t.key ? 'text-fg' : 'text-fg-subtle')}>
                {t.icon}
              </span>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
          {scenarioType === 'debate' ? 'Bağlam / Senaryo' : 'Senaryo'}
        </p>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={selectedType.placeholder}
          maxLength={280}
          rows={4}
          className="w-full bg-surface border border-stroke rounded-xl px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-fg/30 transition-colors resize-none leading-relaxed"
        />
        <div className="flex justify-between mt-1 text-xs text-fg-subtle">
          <span>{contentLen < 20 ? `En az 20 karakter (${20 - contentLen} eksik)` : ''}</span>
          <span className={contentLen > 250 ? 'text-amber-400' : ''}>{contentLen}/280</span>
        </div>
      </div>

      {/* Debate question — only for debate type */}
      {scenarioType === 'debate' && (
        <div>
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
            Tartışma Sorusu <span className="text-fg-subtle normal-case font-normal">(isteğe bağlı)</span>
          </p>
          <input
            type="text"
            value={debateQuestion}
            onChange={e => setDebateQuestion(e.target.value)}
            placeholder="Örn: Sosyal medya gençliğe zararlı mı? (Katılıyorum / Katılmıyorum)"
            maxLength={280}
            className="w-full bg-surface border border-stroke rounded-xl px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-fg/30 transition-colors"
          />
          <p className="text-xs text-fg-subtle mt-1">Kullanıcılar bu soruya Evet/Hayır tarafını seçerek cevap verecek</p>
        </div>
      )}

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">Kategori</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                category === cat.key
                  ? 'bg-surface-2 border-fg/30 text-fg'
                  : 'bg-surface border-stroke text-fg-subtle hover:bg-surface-2'
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
          Etiketler <span className="normal-case font-normal">(max 5)</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-surface-2 border border-stroke text-xs px-2 py-1 rounded-full text-fg">
              <Tag size={10} className="text-fg-subtle" />
              {tag}
              <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-fg-subtle hover:text-fg ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        {tags.length < 5 && (
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Etiket yaz + Enter (örn: aile, iş, arkadaş)"
            className="w-full bg-surface border border-stroke rounded-xl px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-fg/30 transition-colors"
          />
        )}
      </div>

      {/* Preview hint */}
      {isValid && (
        <div className="bg-surface-2 border border-stroke rounded-xl p-3">
          <p className="text-xs text-fg-subtle font-semibold mb-1">Önizleme</p>
          <p className="text-sm text-fg leading-relaxed">{content}</p>
          {scenarioType === 'debate' && debateQuestion && (
            <p className="text-xs text-fg-subtle mt-2 italic">Tartışma sorusu: {debateQuestion}</p>
          )}
        </div>
      )}

      <Button
        className="btn-gradient w-full"
        disabled={!isValid || submitting}
        onClick={submit}
      >
        {submitting ? 'Gönderiliyor...' : 'İncelemeye Gönder — +30 puan'}
      </Button>

      <p className="text-center text-xs text-fg-subtle">
        Senaryolar editörlerimiz tarafından incelendikten sonra toplulukta görünür.
        Onaylanan senaryolar düellolarda da kullanılabilir.
      </p>
    </div>
  )
}
