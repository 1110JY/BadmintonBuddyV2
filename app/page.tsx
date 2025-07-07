"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, BarChart3 } from "lucide-react"

interface Player {
  id: string
  name: string
  createdAt: string
}

interface Session {
  id: string
  date: string
  players: string[]
  games: Game[]
}

interface Game {
  id: string
  team1: [string, string]
  team2: [string, string]
  score1: number
  score2: number
  completed: boolean
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const savedPlayers = localStorage.getItem("badminton-players")
    const savedSessions = localStorage.getItem("badminton-sessions")

    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers))
    }
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions))
    }
  }, [])

  const totalGames = sessions.reduce((acc, session) => acc + session.games.length, 0)
  const completedGames = sessions.reduce(
    (acc, session) => acc + session.games.filter((game) => game.completed).length,
    0,
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Home</h1>
        <p className="text-muted-foreground">Manage players, create sessions, and track your badminton games.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGames}</div>
            <p className="text-xs text-muted-foreground">{totalGames - completedGames} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                sessions.filter((session) => {
                  const sessionDate = new Date(session.date)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return sessionDate >= weekAgo
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/players">
              <Button className="w-full justify-start my-0.5" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Players
              </Button>
            </Link>
            <Link href="/sessions">
              <Button className="w-full justify-start my-0.5" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Create New Session
              </Button>
            </Link>
            <Link href="/stats">
              <Button className="w-full justify-start my-1" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Statistics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest badminton sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground">No sessions yet. Create your first session!</p>
            ) : (
              <div className="space-y-2">
                {sessions
                  .slice(-3)
                  .reverse()
                  .map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.players.length} players, {session.games.length} games
                        </p>
                      </div>
                      <Link href={`/sessions/${session.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
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
