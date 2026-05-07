import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, subject, message } = body

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Mesaj 2000 karakteri geçemez.' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from('contact_messages').insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
  })

  if (error) {
    console.error('Contact insert error:', error.message)
    return NextResponse.json({ error: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
