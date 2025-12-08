"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Trophy, Target, Users, Calendar, Download, Handshake,
  BarChart3, Award, TrendingUp, Medal, Crown, Star
} from "lucide-react"
import { FadeIn } from "@/components/animated/fade-in"
import { AnimatedCard } from "@/components/animated/animated-card"
import { playerService, sessionService } from "@/lib/supabase"
import { migrationService } from "@/lib/migration"

interface Player { id: string; name: string; created_at: string }
interface Game {
  id: string; team1: [string, string]; team2: [string, string]
  score1: number; score2: number; completed: boolean
}
interface Session {
  id: string; date: string; players: string[]; games: Game[]
  created_at: string; updated_at: string
}
interface PlayerStats {
  playerId: string; name: string; gamesPlayed: number; gamesWon: number
  gamesLost: number; winRate: number; totalPoints: number
  averagePoints: number; sessionsPlayed: number; pointsDifference: number
}
interface PairStats {
  pair: [string, string]; gamesPlayed: number; gamesWon: number; totalPoints: number; averagePoints: number
}

export default function StatsPage() {
  const searchParams = useSearchParams()
  const initializedFromQuery = useRef(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [topPair, setTopPair] = useState<{ pair: [string, string]; winRate: number } | null>(null)
  const [pairStatsSorted, setPairStatsSorted] = useState<PairStats[]>([])
  const [timeFilter, setTimeFilter] = useState("all")
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Run migration check (will only migrate once)
      await migrationService.checkAndMigrate()
      
      const [playersData, sessionsData] = await Promise.all([
        playerService.getAll(),
        sessionService.getAll()
      ])
      setPlayers(playersData)
      
      // Sort sessions by date descending (newest first)
      const sortedSessions = [...sessionsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setSessions(sortedSessions)
      
      setError(null)
    } catch (err) {
      setError('Failed to load data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (initializedFromQuery.current) return
    const sessionIdFromQuery = searchParams.get("sessionId")
    if (sessionIdFromQuery && sessions.some(s => s.id === sessionIdFromQuery)) {
      setSelectedSessionId(sessionIdFromQuery)
      setTimeFilter("all")
      initializedFromQuery.current = true
    }
  }, [sessions, searchParams])

  useEffect(() => {
    if (players.length && sessions.length) calculateStats()
  }, [players, sessions, timeFilter, selectedSessionId])

  const getFilteredSessions = () => {
    if (selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId)
      return session ? [session] : []
    }

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
    const pairStats: { [key: string]: { pair: [string, string]; gamesPlayed: number; gamesWon: number; totalPoints: number } } = {}

    players.forEach(p => {
      stats[p.id] = {
        playerId: p.id, name: p.name, gamesPlayed: 0,
        gamesWon: 0, gamesLost: 0, winRate: 0,
        totalPoints: 0, averagePoints: 0, sessionsPlayed: 0, pointsDifference: 0
      }
    })

    filtered.forEach(session => {
      const sessionPlayers = new Set<string>()
      session.games.forEach(game => {
        if (!game.completed) return
        const team1Won = game.score1 > game.score2

        const processTeam = (team: [string, string], won: boolean, score: number, opponentScore: number) => {
          const pairKey = [...team].sort().join("-")
          if (!pairStats[pairKey]) {
            pairStats[pairKey] = { pair: [...team].sort() as [string, string], gamesPlayed: 0, gamesWon: 0, totalPoints: 0 }
          }
          pairStats[pairKey].gamesPlayed++
          if (won) pairStats[pairKey].gamesWon++
          pairStats[pairKey].totalPoints += score

          const pointsDiff = score - opponentScore

          team.forEach(pid => {
            sessionPlayers.add(pid)
            if (stats[pid]) {
              stats[pid].gamesPlayed++
              stats[pid].totalPoints += score
              stats[pid].pointsDifference += pointsDiff
              won ? stats[pid].gamesWon++ : stats[pid].gamesLost++
            }
          })
        }

        processTeam(game.team1, team1Won, game.score1, game.score2)
        processTeam(game.team2, !team1Won, game.score2, game.score1)
      })
      sessionPlayers.forEach(pid => stats[pid] && stats[pid].sessionsPlayed++)
    })

    Object.values(stats).forEach(stat => {
      if (stat.gamesPlayed > 0) {
        stat.winRate = (stat.gamesWon / stat.gamesPlayed) * 100
        stat.averagePoints = stat.totalPoints / stat.gamesPlayed
      }
    })

    const sortedPlayers = Object.values(stats)
      .filter(s => s.gamesPlayed > 0)
      .sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)

    setPlayerStats(sortedPlayers)

    // Calculate pair rankings with average points
    const pairs: PairStats[] = Object.values(pairStats)
      .filter(p => p.gamesPlayed > 0)
      .map(p => ({
        ...p,
        averagePoints: p.totalPoints / p.gamesPlayed,
      }))
    
    // Add winRate for sorting
    pairs.forEach(p => {
      ;(p as any).winRate = (p.gamesWon / p.gamesPlayed) * 100
    })
    pairs.sort((a, b) => (b as any).winRate - (a as any).winRate || b.gamesPlayed - a.gamesPlayed)

    setPairStatsSorted(pairs)

    // Find best pair for topPair display
    let bestPair: { pair: [string, string]; winRate: number } | null = null
    for (const entry of pairs) {
      const winRate = (entry.gamesWon / entry.gamesPlayed) * 100
      if (!bestPair || winRate > bestPair.winRate) {
        bestPair = { pair: entry.pair, winRate }
      }
    }

    setTopPair(bestPair)
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
    link.download = `badminton-stats-${selectedSessionId ?? timeFilter}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalGames = sessions.reduce((sum, s) => sum + s.games.filter(g => g.completed).length, 0)
  const totalSessions = sessions.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 dark:from-purple-400/5 dark:to-pink-400/5" />
        <div className="relative container mx-auto px-4 py-16">
          <FadeIn delay={0.1}>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="h-16 w-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-xl dark:shadow-purple-500/20">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                  <span className="text-purple-600 dark:text-purple-400">Statistics</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                  Comprehensive player performance and game analytics
                </p>
              </motion.div>
              
              <FadeIn delay={0.4}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Select
                    value={selectedSessionId ?? "all"}
                    onValueChange={(value) => {
                      setSelectedSessionId(value === "all" ? null : value)
                    }}
                  >
                    <SelectTrigger className="w-64 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:text-slate-900">
                      <SelectValue>
                        {selectedSessionId
                          ? sessions.find(s => s.id === selectedSessionId)?.date || "Select Session"
                          : "All Sessions"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-white/95 dark:shadow-white/30">
                      <SelectItem value="all" className="dark:text-slate-900">All Sessions</SelectItem>
                      {[...sessions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(session => (
                          <SelectItem key={session.id} value={session.id} className="dark:text-slate-900">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              weekday: "short", year: "numeric", month: "short", day: "numeric"
                            })}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={exportStatsToCSV} variant="outline" className="bg-white/80 hover:bg-white/90 border-slate-300/50 hover:border-purple-300 text-slate-700 hover:text-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-slate-100/80 dark:hover:bg-slate-100 dark:text-slate-800 dark:border-slate-400/50">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </motion.div>
                </div>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 -mt-8 relative z-10">
        {/* Error Message */}
        {error && (
          <FadeIn delay={0.4}>
            <div className="max-w-2xl mx-auto mb-8">
              <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="py-4">
                  <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
                  <div className="flex justify-center mt-2">
                    <Button onClick={loadData} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {loading ? (
          <FadeIn delay={0.6}>
            <div className="max-w-2xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl dark:bg-white/95">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-700">Loading statistics...</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        ) : (
        <>
        {/* Quick Stats Overview */}
        <FadeIn delay={0.6}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {[
              { 
                title: "Total Players", 
                icon: <Users className="h-5 w-5 text-white" />, 
                value: players.length,
                color: "bg-blue-500",
                shadowColor: "dark:shadow-blue-500/20"
              },
              { 
                title: "Total Sessions", 
                icon: <Calendar className="h-5 w-5 text-white" />, 
                value: totalSessions,
                color: "bg-emerald-500",
                shadowColor: "dark:shadow-emerald-500/20"
              },
              { 
                title: "Games Completed", 
                icon: <Trophy className="h-5 w-5 text-white" />, 
                value: totalGames,
                color: "bg-purple-500",
                shadowColor: "dark:shadow-purple-500/20"
              },
              { 
                title: "Active Players", 
                icon: <Target className="h-5 w-5 text-white" />, 
                value: playerStats.length,
                color: "bg-orange-500",
                shadowColor: "dark:shadow-orange-500/20"
              }
            ].map((stat, index) => (
              <AnimatedCard key={index} delay={index * 0.1}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">{stat.title}</CardTitle>
                    <div className={`h-10 w-10 ${stat.color} rounded-lg flex items-center justify-center shadow-lg ${stat.shadowColor}`}>
                      {stat.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">{stat.value}</div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        </FadeIn>

        {/* Top Pair Highlight */}
        {topPair && (
          <FadeIn delay={0.8}>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 mb-12">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg dark:shadow-yellow-500/20">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-slate-800 dark:text-slate-900">🏆 Champion Pair</CardTitle>
                <CardDescription className="text-center text-slate-600 dark:text-slate-700">
                  Top performing partnership
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-900 mb-2">
                  {players.find(p => p.id === topPair.pair[0])?.name || "?"} & {players.find(p => p.id === topPair.pair[1])?.name || "?"}
                </div>
                <div className="text-lg text-purple-600 dark:text-purple-700 font-semibold">
                  {topPair.winRate.toFixed(1)}% Win Rate
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Player Statistics Table */}
        <FadeIn delay={1.0}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-purple-500/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 dark:text-slate-900">Player Statistics</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-700">
                    Performance summary for all players ({selectedSessionId ? "session" : (timeFilter === "all" ? "all time" : timeFilter)})
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {playerStats.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-600 text-center py-8">No game data available for the selected time period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-300">
                        <th className="text-left py-3 text-slate-700 dark:text-slate-800 font-semibold">Player</th>
                        <th className="text-center py-3 text-slate-700 dark:text-slate-800 font-semibold">Games</th>
                        <th className="text-center py-3 text-slate-700 dark:text-slate-800 font-semibold">W/L</th>
                        <th className="text-center py-3 text-slate-700 dark:text-slate-800 font-semibold">Win Rate</th>
                        <th className="text-center py-3 text-slate-700 dark:text-slate-800 font-semibold">Points Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((stat, index) => (
                        <motion.tr 
                          key={stat.playerId} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="border-b border-slate-100 dark:border-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-100/30 transition-colors"
                        >
                          <td className="py-4 font-medium text-slate-800 dark:text-slate-900">{stat.name}</td>
                          <td className="text-center py-4 text-slate-700 dark:text-slate-800">{stat.gamesPlayed}</td>
                          <td className="text-center py-4 font-medium text-slate-800 dark:text-slate-900">{stat.gamesWon}/{stat.gamesLost}</td>
                          <td className="text-center py-4 font-semibold text-purple-600 dark:text-purple-700">{stat.winRate.toFixed(1)}%</td>
                          <td className={`text-center py-4 font-semibold ${stat.pointsDifference >= 0 ? 'text-emerald-600 dark:text-emerald-700' : 'text-red-600 dark:text-red-700'}`}>
                            {stat.pointsDifference > 0 ? '+' : ''}{stat.pointsDifference}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Player Rankings */}
        <FadeIn delay={1.2}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-emerald-500/20">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 dark:text-slate-900">Player Rankings</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-700">
                    Ranked by win rate and games played ({selectedSessionId ? "session" : (timeFilter === "all" ? "all time" : timeFilter)})
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {playerStats.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-600 text-center py-8">No game data available for the selected time period.</p>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {playerStats.map((stat, index) => (
                      <motion.div 
                        key={stat.playerId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        whileHover={{ y: -2 }}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200/50 dark:border-slate-300/50 rounded-xl bg-gradient-to-r from-white/40 to-white/60 dark:from-white/20 dark:to-white/40 hover:from-white/60 hover:to-white/80 dark:hover:from-white/40 dark:hover:to-white/60 transition-all duration-300 shadow-sm hover:shadow-lg gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-slate-400 to-slate-600'
                          }`}>
                            {index < 3 ? <Medal className="h-5 w-5" /> : index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-900">{stat.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-700">
                              {stat.gamesPlayed} games • {stat.sessionsPlayed} sessions
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-6 sm:text-right text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-600">Win Rate</p>
                            <p className="font-bold text-lg text-purple-600 dark:text-purple-700">{stat.winRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-600">W/L</p>
                            <p className="font-bold text-slate-800 dark:text-slate-900">{stat.gamesWon}/{stat.gamesLost}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-600">Points Diff</p>
                            <p className={`font-bold ${stat.pointsDifference >= 0 ? 'text-emerald-600 dark:text-emerald-700' : 'text-red-600 dark:text-red-700'}`}>
                              {stat.pointsDifference > 0 ? '+' : ''}{stat.pointsDifference}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-600">Avg Points</p>
                            <p className="font-bold text-slate-800 dark:text-slate-900">{stat.averagePoints.toFixed(1)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Pair Rankings */}
        <FadeIn delay={1.4}>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-blue-500/20">
                  <Handshake className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-slate-800 dark:text-slate-900">Pair Rankings</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-700">
                    Ranked by win rate and games played ({selectedSessionId ? "session" : (timeFilter === "all" ? "all time" : timeFilter)})
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pairStatsSorted.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-600 text-center py-8">No pair data available for the selected time period.</p>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {pairStatsSorted.map((pairStat, index) => {
                      const player1 = players.find(p => p.id === pairStat.pair[0])?.name || "?"
                      const player2 = players.find(p => p.id === pairStat.pair[1])?.name || "?"
                      const winRate = ((pairStat.gamesWon / pairStat.gamesPlayed) * 100)
                      return (
                        <motion.div 
                          key={pairStat.pair.join("-")}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1, duration: 0.6 }}
                          whileHover={{ y: -2 }}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-slate-200/50 dark:border-slate-300/50 rounded-xl bg-gradient-to-r from-white/40 to-white/60 dark:from-white/20 dark:to-white/40 hover:from-white/60 hover:to-white/80 dark:hover:from-white/40 dark:hover:to-white/60 transition-all duration-300 shadow-sm hover:shadow-lg gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}>
                              {index < 3 ? <Star className="h-5 w-5" /> : index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-900">{player1} & {player2}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-700">
                                {pairStat.gamesPlayed} games
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-6 sm:text-right text-sm">
                            <div>
                              <p className="text-slate-500 dark:text-slate-600">Win Rate</p>
                              <p className="font-bold text-lg text-blue-600 dark:text-blue-700">{winRate.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-600">Games Played</p>
                              <p className="font-bold text-slate-800 dark:text-slate-900">{pairStat.gamesPlayed}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 dark:text-slate-600">Avg Points</p>
                              <p className="font-bold text-slate-800 dark:text-slate-900">{pairStat.averagePoints.toFixed(1)}</p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
        </>
        )}
      </div>
    </div>
  )
}
