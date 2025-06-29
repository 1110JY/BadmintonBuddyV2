"use client"

import { useState, useEffect } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Trophy, Target, Users, Calendar, Download,
} from "lucide-react"

interface Player { id: string; name: string; createdAt: string }
interface Game {
  id: string; team1: [string, string]; team2: [string, string]
  score1: number; score2: number; completed: boolean
}
interface Session {
  id: string; date: string; players: string[]; games: Game[]
}
interface PlayerStats {
  playerId: string; name: string; gamesPlayed: number; gamesWon: number
  gamesLost: number; winRate: number; totalPoints: number
  averagePoints: number; sessionsPlayed: number
}

export default function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [timeFilter, setTimeFilter] = useState("all")

  useEffect(() => {
    const savedPlayers = localStorage.getItem("badminton-players")
    const savedSessions = localStorage.getItem("badminton-sessions")
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers))
    if (savedSessions) setSessions(JSON.parse(savedSessions))
  }, [])

  useEffect(() => {
    if (players.length && sessions.length) calculateStats()
  }, [players, sessions, timeFilter])

  const getFilteredSessions = () => {
    const now = new Date()
    const cutoff = new Date()
    switch (timeFilter) {
      case "week": cutoff.setDate(now.getDate() - 7); break
      case "month": cutoff.setMonth(now.getMonth() - 1); break
      case "year": cutoff.setFullYear(now.getFullYear() - 1); break
      default: return sessions
    }
    return sessions.filter(s => new Date(s.date) >= cutoff)
  }

  const calculateStats = () => {
    const filtered = getFilteredSessions()
    const stats: { [key: string]: PlayerStats } = {}

    players.forEach(p => {
      stats[p.id] = {
        playerId: p.id, name: p.name, gamesPlayed: 0,
        gamesWon: 0, gamesLost: 0, winRate: 0,
        totalPoints: 0, averagePoints: 0, sessionsPlayed: 0
      }
    })

    filtered.forEach(session => {
      const sessionPlayers = new Set<string>()
      session.games.forEach(game => {
        if (!game.completed) return
        const team1Won = game.score1 > game.score2
        game.team1.forEach(pid => {
          sessionPlayers.add(pid)
          if (stats[pid]) {
            stats[pid].gamesPlayed++
            stats[pid].totalPoints += game.score1
            team1Won ? stats[pid].gamesWon++ : stats[pid].gamesLost++
          }
        })
        game.team2.forEach(pid => {
          sessionPlayers.add(pid)
          if (stats[pid]) {
            stats[pid].gamesPlayed++
            stats[pid].totalPoints += game.score2
            team1Won ? stats[pid].gamesLost++ : stats[pid].gamesWon++
          }
        })
      })
      sessionPlayers.forEach(pid => stats[pid] && stats[pid].sessionsPlayed++)
    })

    Object.values(stats).forEach(stat => {
      if (stat.gamesPlayed > 0) {
        stat.winRate = (stat.gamesWon / stat.gamesPlayed) * 100
        stat.averagePoints = stat.totalPoints / stat.gamesPlayed
      }
    })

    const sorted = Object.values(stats)
      .filter(s => s.gamesPlayed > 0)
      .sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)

    setPlayerStats(sorted)
  }

  const exportStatsToCSV = () => {
    const csv = [
      ["Player", "Games Played", "Games Won", "Games Lost", "Win Rate (%)", "Total Points", "Avg Points", "Sessions Played"],
      ...playerStats.map(s => [
        s.name, s.gamesPlayed, s.gamesWon, s.gamesLost,
        s.winRate.toFixed(1), s.totalPoints, s.averagePoints.toFixed(1), s.sessionsPlayed
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `badminton-stats-${timeFilter}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalGames = sessions.reduce((sum, s) => sum + s.games.filter(g => g.completed).length, 0)
  const totalSessions = sessions.length

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Statistics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Player performance and game statistics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportStatsToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { title: "Total Players", icon: <Users className="h-4 w-4" />, value: players.length },
          { title: "Total Sessions", icon: <Calendar className="h-4 w-4" />, value: totalSessions },
          { title: "Games Completed", icon: <Trophy className="h-4 w-4" />, value: totalGames },
          { title: "Active Players", icon: <Target className="h-4 w-4" />, value: playerStats.length },
        ].map(({ title, icon, value }, i) => (
          <Card key={i}>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Rankings</CardTitle>
          <CardDescription>
            Ranked by win rate and games played ({timeFilter === "all" ? "all time" : timeFilter})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playerStats.length === 0 ? (
            <p className="text-muted-foreground">No game data available for the selected time period.</p>
          ) : (
            <div className="space-y-4">
              {playerStats.map((stat, index) => (
                <div key={stat.playerId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{stat.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.gamesPlayed} games • {stat.sessionsPlayed} sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 sm:text-right text-sm">
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-bold text-lg">{stat.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">W/L</p>
                      <p className="font-bold">{stat.gamesWon}/{stat.gamesLost}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Points</p>
                      <p className="font-bold">{stat.averagePoints.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
