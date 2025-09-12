import { supabase, playerService, sessionService } from './supabase'
import { getDeviceId } from './device'

export interface LocalStoragePlayer {
  id: string
  name: string
  createdAt: string
}

export interface LocalStorageSession {
  id: string
  date: string
  players: string[]
  games: any[]
}

export const migrationService = {
  async checkAndMigrate(): Promise<{ migrated: boolean; error?: string; playersCount?: number; sessionsCount?: number }> {
    try {
      // Check if we're running on the client side
      if (typeof window === 'undefined') {
        return { migrated: false, error: 'Server-side rendering' }
      }

      // Check if migration has already been completed
      const migrationCompleted = localStorage.getItem('supabase-migration-completed')
      if (migrationCompleted === 'true') {
        return { migrated: false } // Already migrated
      }

      // Ensure device ID is initialized
      const deviceId = getDeviceId()
      console.log(`Migrating data for device: ${deviceId}`)

      // Get localStorage data
      const localPlayers = localStorage.getItem('badminton-players')
      const localSessions = localStorage.getItem('badminton-sessions')

      if (!localPlayers && !localSessions) {
        // No local data to migrate
        localStorage.setItem('supabase-migration-completed', 'true')
        return { migrated: false }
      }

      let migratedPlayers: any[] = []
      let migratedSessions: any[] = []

      // Migrate players first
      if (localPlayers) {
        const players: LocalStoragePlayer[] = JSON.parse(localPlayers)
        console.log(`Migrating ${players.length} players to Supabase...`)
        
        for (const player of players) {
          try {
            const migratedPlayer = await playerService.create(player.name)
            migratedPlayers.push({
              oldId: player.id,
              newId: migratedPlayer.id,
              name: player.name
            })
          } catch (error) {
            console.error(`Failed to migrate player ${player.name}:`, error)
          }
        }
      }

      // Migrate sessions with updated player IDs
      if (localSessions && migratedPlayers.length > 0) {
        const sessions: LocalStorageSession[] = JSON.parse(localSessions)
        console.log(`Migrating ${sessions.length} sessions to Supabase...`)

        for (const session of sessions) {
          try {
            // Map old player IDs to new Supabase player IDs
            const updatedPlayerIds = session.players.map(oldPlayerId => {
              const migratedPlayer = migratedPlayers.find(mp => mp.oldId === oldPlayerId)
              return migratedPlayer ? migratedPlayer.newId : null
            }).filter(Boolean) // Remove null values

            if (updatedPlayerIds.length > 0) {
              // Update games with new player IDs
              const updatedGames = session.games.map(game => ({
                ...game,
                team1: game.team1.map((oldId: string) => {
                  const migratedPlayer = migratedPlayers.find(mp => mp.oldId === oldId)
                  return migratedPlayer ? migratedPlayer.newId : oldId
                }),
                team2: game.team2.map((oldId: string) => {
                  const migratedPlayer = migratedPlayers.find(mp => mp.oldId === oldId)
                  return migratedPlayer ? migratedPlayer.newId : oldId
                })
              }))

              const migratedSession = await sessionService.create({
                date: session.date,
                players: updatedPlayerIds,
                games: updatedGames
              })
              migratedSessions.push(migratedSession)
            }
          } catch (error) {
            console.error(`Failed to migrate session ${session.id}:`, error)
          }
        }
      }

      // Mark migration as completed
      localStorage.setItem('supabase-migration-completed', 'true')
      
      // Optionally backup original data
      if (localPlayers) localStorage.setItem('badminton-players-backup', localPlayers)
      if (localSessions) localStorage.setItem('badminton-sessions-backup', localSessions)

      console.log(`Migration completed! Migrated ${migratedPlayers.length} players and ${migratedSessions.length} sessions for device ${deviceId}`)
      
      return { 
        migrated: true,
        playersCount: migratedPlayers.length,
        sessionsCount: migratedSessions.length
      }

    } catch (error) {
      console.error('Migration failed:', error)
      return { 
        migrated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  },

  async resetMigration() {
    // For testing purposes - reset migration flag
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase-migration-completed')
    }
  },

  getMigrationStatus(): { completed: boolean; hasBackup: boolean; deviceId: string | null } {
    if (typeof window === 'undefined') {
      return { completed: false, hasBackup: false, deviceId: null }
    }
    
    const completed = localStorage.getItem('supabase-migration-completed') === 'true'
    const hasBackup = !!(localStorage.getItem('badminton-players-backup') || localStorage.getItem('badminton-sessions-backup'))
    const deviceId = localStorage.getItem('badminton_buddy_device_id')
    
    return { completed, hasBackup, deviceId }
  }
}