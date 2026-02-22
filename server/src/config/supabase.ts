import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Minimal database schema type so upsert/select are properly typed.
// Run `supabase gen types typescript` after connecting to replace this.
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          firebase_uid: string
          email: string
          display_name: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          firebase_uid: string
          email: string
          display_name?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: Partial<{
          email: string
          display_name: string | null
          photo_url: string | null
          updated_at: string
        }>
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          event_id: string
          event_source: string
          event_name: string
          event_data: Record<string, unknown>
          created_at: string
        }
        Insert: {
          user_id: string
          event_id: string
          event_source: string
          event_name: string
          event_data: Record<string, unknown>
        }
        Update: Partial<{
          event_name: string
          event_data: Record<string, unknown>
        }>
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          default_latitude: number | null
          default_longitude: number | null
          default_zip_code: string | null
          default_radius_miles: number
          preferred_event_types: string[]
          notifications_enabled: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          default_latitude?: number | null
          default_longitude?: number | null
          default_zip_code?: string | null
          default_radius_miles?: number
          preferred_event_types?: string[]
          notifications_enabled?: boolean
          updated_at?: string
        }
        Update: Partial<{
          default_latitude: number | null
          default_longitude: number | null
          default_zip_code: string | null
          default_radius_miles: number
          preferred_event_types: string[]
          notifications_enabled: boolean
          updated_at: string
        }>
        Relationships: []
      }
    }
  }
}

let _supabase: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
    }
    _supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  }
  return _supabase
}
