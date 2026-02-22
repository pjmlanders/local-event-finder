import { apiClient } from './client'
import type { UserProfile, UserPreferences, UnifiedEvent } from 'shared'

export async function syncUser(): Promise<UserProfile> {
  const { user } = await import('../config/firebase').then(m => ({ user: m.auth.currentUser }))
  const { data } = await apiClient.post<UserProfile>('/users/sync', {
    displayName: user?.displayName ?? null,
    photoUrl: user?.photoURL ?? null,
  })
  return data
}

export async function getFavorites(): Promise<UnifiedEvent[]> {
  const { data } = await apiClient.get<{ events: UnifiedEvent[] }>('/users/favorites')
  return data.events
}

export async function addFavorite(event: UnifiedEvent): Promise<void> {
  await apiClient.post('/users/favorites', event)
}

export async function removeFavorite(eventId: string): Promise<void> {
  await apiClient.delete(`/users/favorites/${eventId}`)
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const { data } = await apiClient.get<UserPreferences | Record<string, never>>('/users/preferences')
  if (!data || Object.keys(data).length === 0) return null
  return data as UserPreferences
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const { data } = await apiClient.put<UserPreferences>('/users/preferences', prefs)
  return data
}
