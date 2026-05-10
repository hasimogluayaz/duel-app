export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SenaryoOlusturClient } from './SenaryoOlusturClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Senaryo Oluştur · Kapisio',
  description: 'Kendi senaryonu oluştur, topluluğa sun.',
}

export default async function SenaryoOlusturPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/senaryo-olustur')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, total_points')
    .eq('id', user.id)
    .single()

  return <SenaryoOlusturClient profile={profile} />
}
