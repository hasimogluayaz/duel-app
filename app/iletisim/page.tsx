'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle, Mail, Clock } from 'lucide-react'

export default function IletisimPage() {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json()
      toast(json.error || 'Mesaj gönderilemedi.', 'error')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-fg mb-3">Mesajın Alındı!</h2>
          <p className="text-fg-muted text-sm">
            En kısa sürede, genellikle 48 saat içinde yanıt vereceğiz.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-fg mb-2">İletişim</h1>
        <p className="text-fg-muted">Soru, öneri veya geri bildirimleriniz için yazın</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Adınız"
                placeholder="Ad Soyad"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                type="email"
                label="Email"
                placeholder="ornek@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Konu"
              placeholder="Mesajınızın konusu"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              required
            />
            <Textarea
              label="Mesaj"
              placeholder="Mesajınızı buraya yazın..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={6}
              required
              charCount={form.message.length}
              maxChars={2000}
            />
            <Button type="submit" loading={loading} className="w-full btn-gradient">
              Gönder
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-4 bg-surface border border-stroke rounded-xl">
            <Mail size={20} className="text-purple-400 mb-2" />
            <p className="text-sm font-medium text-fg mb-1">Email</p>
            <a href="mailto:destek@kapisio.com" className="text-xs text-purple-400 hover:underline">
              destek@kapisio.com
            </a>
          </div>
          <div className="p-4 bg-surface border border-stroke rounded-xl">
            <Clock size={20} className="text-purple-400 mb-2" />
            <p className="text-sm font-medium text-fg mb-1">Yanıt Süresi</p>
            <p className="text-xs text-fg-muted">Genellikle 48 saat içinde yanıt veriyoruz.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
