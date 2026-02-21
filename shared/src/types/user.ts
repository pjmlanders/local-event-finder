import type { EventType } from './event.js'

export interface UserProfile {
  id: string
  firebaseUid: string
  email: string
  displayName: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface UserPreferences {
  id: string
  userId: string
  defaultLatitude: number | null
  defaultLongitude: number | null
  defaultZipCode: string | null
  defaultRadiusMiles: number
  preferredEventTypes: EventType[]
  notificationsEnabled: boolean
}
