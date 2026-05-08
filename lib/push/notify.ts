import { createApiClient } from '@/lib/supabase/typed'
import { sendPushNotification, type PushPayload } from './webpush'

export async function pushToUser(userId: string, payload: PushPayload) {
  try {
    const supabase = createApiClient()
    const { data: subs } = await (supabase as any)
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs?.length) return

    await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        sendPushNotification(sub, payload)
      )
    )
  } catch {
    // Push is best-effort — never throw
  }
}
