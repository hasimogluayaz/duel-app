import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookmarksClient from './BookmarksClient'

export const dynamic = 'force-dynamic'

export default async function BookmarksPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  return <BookmarksClient />
}
