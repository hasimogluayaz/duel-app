import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kapisio.com'

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/oyun`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/arsiv`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/kesfet`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/liderlik`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/karar-ver`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/nasil-oynanir`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/giris`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/kayit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/gizlilik-politikasi`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/kullanim-kosullari`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    const supabase = createClient()

    // Public user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('is_banned', false)
      .order('total_points', { ascending: false })
      .limit(500)

    const profilePages: MetadataRoute.Sitemap = (profiles ?? []).map((p: any) => ({
      url: `${base}/profil/${p.username}`,
      lastModified: new Date(p.updated_at ?? new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Public scenarios
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id, updated_at')
      .eq('is_approved', true)
      .order('answer_count', { ascending: false })
      .limit(500)

    const scenarioPages: MetadataRoute.Sitemap = (scenarios ?? []).map((s: any) => ({
      url: `${base}/arsiv/${s.id}`,
      lastModified: new Date(s.updated_at ?? new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    return [...staticPages, ...profilePages, ...scenarioPages]
  } catch {
    return staticPages
  }
}
