import { createClient } from '@supabase/supabase-js'
import { getDeviceId } from './device'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

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
          device_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string  // Required - manual timestamp ID
          date: string
          players: string[]
          games: any[]
          device_id: string
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
          device_id: string
          created_at: string
        }
        Insert: {
          id: string  // Required - manual timestamp ID
          name: string
          device_id: string
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

// Utility functions for database operations
export const playerService = {
  async getAll() {
    const deviceId = getDeviceId()
    
    // First try with device_id filtering
    let { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true })
    
    // If device_id column doesn't exist, fall back to get all data
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('device_id column not found, falling back to legacy mode')
      const fallback = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: true })
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data || []
  },

  async create(name: string) {
    const deviceId = getDeviceId()
    
    // Generate a timestamp-based ID like the existing data
    const id = Date.now().toString()
    
    // Try to create with device_id
    let { data, error } = await supabase
      .from('players')
      .insert({ id, name, device_id: deviceId })
      .select()
      .single()
    
    // If device_id column doesn't exist, create without it
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Creating player without device_id (legacy mode)')
      const fallback = await supabase
        .from('players')
        .insert({ id, name })
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data
  },

  async update(id: string, name: string) {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { data, error } = await supabase
      .from('players')
      .update({ name })
      .eq('id', id)
      .eq('device_id', deviceId)
      .select()
      .single()
    
    // If device_id column doesn't exist, update without filtering
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Updating player without device_id filtering (legacy mode)')
      const fallback = await supabase
        .from('players')
        .update({ name })
        .eq('id', id)
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId)
    
    // If device_id column doesn't exist, delete without filtering
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Deleting player without device_id filtering (legacy mode)')
      const fallback = await supabase
        .from('players')
        .delete()
        .eq('id', id)
      error = fallback.error
    }
    
    if (error) throw error
  }
}

export const sessionService = {
  async getAll() {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('device_id', deviceId)
      .order('date', { ascending: false })
    
    // If device_id column doesn't exist, fall back to get all data
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('device_id column not found in sessions, falling back to legacy mode')
      const fallback = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false })
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('device_id', deviceId)
      .single()
    
    // If device_id column doesn't exist, get without filtering
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Getting session without device_id filtering (legacy mode)')
      const fallback = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data
  },

  async create(session: Omit<Database['public']['Tables']['sessions']['Insert'], 'id' | 'device_id'>) {
    const deviceId = getDeviceId()
    
    // Generate a timestamp-based ID like the existing data
    const id = Date.now().toString()
    
    // Try to create with device_id
    let { data, error } = await supabase
      .from('sessions')
      .insert({ id, ...session, device_id: deviceId })
      .select()
      .single()
    
    // If device_id column doesn't exist, create without it
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Creating session without device_id (legacy mode)')
      const fallback = await supabase
        .from('sessions')
        .insert({ id, ...session })
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Database['public']['Tables']['sessions']['Update']) {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('device_id', deviceId)
      .select()
      .single()
    
    // If device_id column doesn't exist, update without filtering
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Updating session without device_id filtering (legacy mode)')
      const fallback = await supabase
        .from('sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const deviceId = getDeviceId()
    
    // Try with device_id filtering
    let { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId)
    
    // If device_id column doesn't exist, delete without filtering
    if (error && error.message.includes('column "device_id" does not exist')) {
      console.log('Deleting session without device_id filtering (legacy mode)')
      const fallback = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
      error = fallback.error
    }
    
    if (error) throw error
  }
}