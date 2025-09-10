"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Calendar, Users, Trophy, Share2 } from "lucide-react"

interface Player {
  id: string
  name: string
  created_at: string
}

interface Session {
  id: string
  date: string
  players: string[]
  games: Game[]
  created_at: string
  updated_at: string
}

interface Game {
  id: string
  team1: [string, string]
  team2: [string, string]
  score1: number
  score2: number
  completed: boolean
}

export default function SharedSessionPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) {
          throw sessionError
        }

        if (!sessionData) {
          setError('Session not found')
          return
        }

        setSession(sessionData)

        // Fetch all players to get names
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')

        if (playersError) {
          throw playersError
        }

        setPlayers(playersData || [])
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown Player"
  }

  const calculatePlayerStats = () => {
    if (!session) return []

    const stats: { [playerId: string]: { wins: number; losses: number; gamesPlayed: number; pointsDifference: number } } = {}

    // Initialize stats for all players
    session.players.forEach(playerId => {
      stats[playerId] = { wins: 0, losses: 0, gamesPlayed: 0, pointsDifference: 0 }
    })

    // Calculate stats from completed games
    session.games.filter(game => game.completed).forEach(game => {
      const team1Won = game.score1 > game.score2
      const pointsDiff = Math.abs(game.score1 - game.score2)
      
      // Team 1 players
      game.team1.forEach(playerId => {
        stats[playerId].gamesPlayed++
        if (team1Won) {
          stats[playerId].wins++
          stats[playerId].pointsDifference += pointsDiff
        } else {
          stats[playerId].losses++
          stats[playerId].pointsDifference -= pointsDiff
        }
      })

      // Team 2 players
      game.team2.forEach(playerId => {
        stats[playerId].gamesPlayed++
        if (!team1Won) {
          stats[playerId].wins++
          stats[playerId].pointsDifference += pointsDiff
        } else {
          stats[playerId].losses++
          stats[playerId].pointsDifference -= pointsDiff
        }
      })
    })

    return Object.entries(stats).map(([playerId, stat]) => ({
      playerId,
      name: getPlayerName(playerId),
      ...stat,
      winRate: stat.gamesPlayed > 0 ? (stat.wins / stat.gamesPlayed * 100).toFixed(1) : '0.0'
    })).sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
            <p className="text-muted-foreground">
              {error || "The shared session link may be invalid or the session may have been removed."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const playerStats = calculatePlayerStats()
  const completedGames = session.games.filter(g => g.completed)

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Shared Session</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Badminton Session - {new Date(session.date).toLocaleDateString()}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {session.players.length} players, {completedGames.length} games completed
        </p>
      </div>

      <div className="grid gap-6">
        {/* Session Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{session.players.length}</p>
                <p className="text-sm text-muted-foreground">Players</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{completedGames.length}</p>
                <p className="text-sm text-muted-foreground">Games Played</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p className="text-sm text-muted-foreground">Session Date</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Player Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
            <CardDescription>Performance summary for all players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Player</th>
                    <th className="text-center py-2">Games</th>
                    <th className="text-center py-2">W/L</th>
                    <th className="text-center py-2">Win Rate</th>
                    <th className="text-center py-2">Points Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((stat) => (
                    <tr key={stat.playerId} className="border-b">
                      <td className="py-3 font-medium">{stat.name}</td>
                      <td className="text-center py-3">{stat.gamesPlayed}</td>
                      <td className="text-center py-3 font-medium">{stat.wins}/{stat.losses}</td>
                      <td className="text-center py-3 font-semibold">{stat.winRate}%</td>
                      <td className={`text-center py-3 font-semibold ${stat.pointsDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.pointsDifference > 0 ? '+' : ''}{stat.pointsDifference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Games Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Games Summary</CardTitle>
            <CardDescription>All games played in this session</CardDescription>
          </CardHeader>
          <CardContent>
            {completedGames.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed games in this session yet.</p>
            ) : (
              <div className="space-y-4">
                {completedGames.map((game, index) => (
                  <div key={game.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">Game {index + 1}</h4>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        game.score1 > game.score2 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {game.score1 > game.score2 
                          ? `${getPlayerName(game.team1[0])} & ${getPlayerName(game.team1[1])} Won`
                          : `${getPlayerName(game.team2[0])} & ${getPlayerName(game.team2[1])} Won`
                        }
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="font-medium">Team 1</p>
                        <p className="text-sm text-muted-foreground">
                          {getPlayerName(game.team1[0])} & {getPlayerName(game.team1[1])}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{game.score1} - {game.score2}</p>
                      </div>
                      <div>
                        <p className="font-medium">Team 2</p>
                        <p className="text-sm text-muted-foreground">
                          {getPlayerName(game.team2[0])} & {getPlayerName(game.team2[1])}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}