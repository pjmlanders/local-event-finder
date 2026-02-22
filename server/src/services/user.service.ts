import { getSupabase } from '../config/supabase.js'
import type { UserProfile, UserPreferences, EventType } from 'shared'
import type { UnifiedEvent } from 'shared'

// Type helpers since Supabase types require generated DB schema
// (run `supabase gen types typescript` once the project is set up)
interface UserRow { id: string; firebase_uid: string; email: string; display_name: string | null; photo_url: string | null; created_at: string; updated_at: string }
interface PreferenceRow { id: string; user_id: string; default_latitude: number | null; default_longitude: number | null; default_zip_code: string | null; default_radius_miles: number; preferred_event_types: string[]; notifications_enabled: boolean }
interface FavoriteRow { event_data: Record<string, unknown> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return getSupabase() as any }

// ─── User sync ───────────────────────────────────────────────────────────────

export async function syncUser(firebaseUid: string, email: string, displayName: string | null, photoUrl: string | null): Promise<UserProfile> {
  const { data, error } = await db()
    .from('users')
    .upsert(
      { firebase_uid: firebaseUid, email, display_name: displayName, photo_url: photoUrl, updated_at: new Date().toISOString() },
      { onConflict: 'firebase_uid' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  const row = data as UserRow

  return {
    id: row.id,
    firebaseUid: row.firebase_uid,
    email: row.email,
    displayName: row.display_name,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getUserId(firebaseUid: string): Promise<string> {
  const { data, error } = await db()
    .from('users')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single()
  if (error || !data) throw new Error('User not found')
  return (data as { id: string }).id
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function getUserFavorites(firebaseUid: string): Promise<UnifiedEvent[]> {
  const userId = await getUserId(firebaseUid)

  const { data, error } = await db()
    .from('favorites')
    .select('event_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data as FavoriteRow[]) ?? []).map(row => row.event_data as unknown as UnifiedEvent)
}

export async function addFavorite(firebaseUid: string, event: UnifiedEvent): Promise<void> {
  const userId = await getUserId(firebaseUid)

  const { error } = await db().from('favorites').upsert({
    user_id: userId,
    event_id: event.id,
    event_source: event.source,
    event_name: event.name,
    event_data: event,
  }, { onConflict: 'user_id,event_id' })

  if (error) throw new Error(error.message)
}

export async function removeFavorite(firebaseUid: string, eventId: string): Promise<void> {
  const userId = await getUserId(firebaseUid)

  const { error } = await db()
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId)

  if (error) throw new Error(error.message)
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getUserPreferences(firebaseUid: string): Promise<UserPreferences | null> {
  const userId = await getUserId(firebaseUid)

  const { data, error } = await db()
    .from('user_preferences')
    .select()
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as PreferenceRow
  return {
    id: row.id,
    userId: row.user_id,
    defaultLatitude: row.default_latitude,
    defaultLongitude: row.default_longitude,
    defaultZipCode: row.default_zip_code,
    defaultRadiusMiles: row.default_radius_miles,
    preferredEventTypes: (row.preferred_event_types ?? []) as EventType[],
    notificationsEnabled: row.notifications_enabled,
  }
}

export async function upsertUserPreferences(firebaseUid: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const userId = await getUserId(firebaseUid)

  const { data, error } = await db()
    .from('user_preferences')
    .upsert({
      user_id: userId,
      default_latitude: prefs.defaultLatitude,
      default_longitude: prefs.defaultLongitude,
      default_zip_code: prefs.defaultZipCode,
      default_radius_miles: prefs.defaultRadiusMiles ?? 25,
      preferred_event_types: prefs.preferredEventTypes ?? [],
      notifications_enabled: prefs.notificationsEnabled ?? false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const row = data as PreferenceRow

  return {
    id: row.id,
    userId: row.user_id,
    defaultLatitude: row.default_latitude,
    defaultLongitude: row.default_longitude,
    defaultZipCode: row.default_zip_code,
    defaultRadiusMiles: row.default_radius_miles,
    preferredEventTypes: (row.preferred_event_types ?? []) as EventType[],
    notificationsEnabled: row.notifications_enabled,
  }
}
