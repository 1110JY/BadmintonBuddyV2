"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Plus, Users, Trophy } from "lucide-react"

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

export default function SessionsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    const savedPlayers = localStorage.getItem("badminton-players")
    const savedSessions = localStorage.getItem("badminton-sessions")

    if (savedPlayers) setPlayers(JSON.parse(savedPlayers))
    if (savedSessions) setSessions(JSON.parse(savedSessions))
  }, [])

  const saveSessionsToStorage = (updatedSessions: Session[]) => {
    localStorage.setItem("badminton-sessions", JSON.stringify(updatedSessions))
    setSessions(updatedSessions)
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  const createSession = () => {
    if (selectedPlayers.length >= 4) {
      const newSession: Session = {
        id: Date.now().toString(),
        date: sessionDate,
        players: selectedPlayers,
        games: [],
      }
      const updatedSessions = [...sessions, newSession]
      saveSessionsToStorage(updatedSessions)
      setSelectedPlayers([])
      setIsCreateDialogOpen(false)
    }
  }

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown"
  }

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create and manage your badminton sessions
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Select players and date for your badminton session.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />

              <div className="space-y-2">
                <Label>Select Players (minimum 4)</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={player.id}
                        checked={selectedPlayers.includes(player.id)}
                        onCheckedChange={() => togglePlayerSelection(player.id)}
                      />
                      <Label htmlFor={player.id}>{player.name}</Label>
                    </div>
                  ))}
                </div>
                {players.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No players available. Add players first.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createSession} disabled={selectedPlayers.length < 4}>
                Create Session ({selectedPlayers.length} players)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Create your first session to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" disabled={players.length < 4}>
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Button>
            {players.length < 4 && (
              <p className="text-sm text-muted-foreground mt-2">
                You need at least 4 players to create a session
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions
            .slice()
            .reverse()
            .map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-base sm:text-lg">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <Link href={`/sessions/${session.id}`}>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        Manage Session
                      </Button>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm space-y-1 sm:space-y-0">
                      <span className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {session.players.length} players
                      </span>
                      <span className="flex items-center">
                        <Trophy className="mr-1 h-4 w-4" />
                        {session.games.filter((g) => g.completed).length}/{session.games.length} games completed
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Players:</p>
                    <div className="flex flex-wrap gap-2">
                      {session.players.map((playerId) => (
                        <span
                          key={playerId}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                        >
                          {getPlayerName(playerId)}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
