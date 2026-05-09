import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookmarksClient from './BookmarksClient'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  return <BookmarksClient />
}
