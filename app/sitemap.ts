import { MetadataRoute } from 'next'

const BASE = 'https://kapisio.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/oyun`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/kesfet`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/liderlik`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/arsiv`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/karar-ver`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/nasil-oynanir`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/hakkinda`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/iletisim`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/gizlilik`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/kullanim-kosullari`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/cerez-politikasi`, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
