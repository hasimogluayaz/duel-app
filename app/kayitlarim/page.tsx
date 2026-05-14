import BookmarksClient from './BookmarksClient'

export const dynamic = 'force-dynamic'

export default function BookmarksPage() {
  // Auth is handled client-side inside BookmarksClient
  return <BookmarksClient />
}
