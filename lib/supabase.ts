import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          date: string
          players: string[]
          games: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          players: string[]
          games: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          players?: string[]
          games?: any[]
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
    }
  }
}