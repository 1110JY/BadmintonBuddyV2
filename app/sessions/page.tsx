"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { Calendar, Plus, Users, Trophy, CalendarPlus, Clock, Target } from "lucide-react"
import { FadeIn } from "@/components/animated/fade-in"
import { AnimatedCard } from "@/components/animated/animated-card"
import { playerService, sessionService } from "@/lib/supabase"
import { migrationService } from "@/lib/migration"

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

interface PlayerGroup {
  id: string
  name: string
  players: string[]
}

export default function SessionsPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0])
  const [playerGroups, setPlayerGroups] = useState<PlayerGroup[]>([])
  const [groupName, setGroupName] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Run migration check (will only migrate once)
      const migrationResult = await migrationService.checkAndMigrate()
      if (migrationResult.error) {
        console.warn('Migration warning:', migrationResult.error)
      }
      
      const [playersData, sessionsData] = await Promise.all([
        playerService.getAll(),
        sessionService.getAll()
      ])
      setPlayers(playersData)
      // Ensure sessions are sorted newest-first
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
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_player_groups")
      if (stored) {
        try {
          setPlayerGroups(JSON.parse(stored))
        } catch (err) {
          console.warn("Failed to parse player groups", err)
        }
      }
    }
  }, [])

  const persistGroups = (groups: PlayerGroup[]) => {
    setPlayerGroups(groups)
    if (typeof window !== "undefined") {
      localStorage.setItem("bb_player_groups", JSON.stringify(groups))
    }
  }

  const saveCurrentGroup = () => {
    if (!groupName.trim() || selectedPlayers.length === 0) return
    const newGroup: PlayerGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      players: selectedPlayers,
    }
    persistGroups([newGroup, ...playerGroups])
    setGroupName("")
  }

  const applyGroup = (group: PlayerGroup) => {
    setSelectedPlayers(group.players)
  }

  const removeGroup = (id: string) => {
    const updated = playerGroups.filter((g) => g.id !== id)
    persistGroups(updated)
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  const createSession = async () => {
    if (selectedPlayers.length >= 4) {
      try {
        const newSession = await sessionService.create({
          date: sessionDate,
          players: selectedPlayers,
          games: [],
        })
        setSessions(prev => [newSession, ...prev])
        setSelectedPlayers([])
        setIsCreateDialogOpen(false)
        router.push(`/sessions/${newSession.id}`)
        setError(null)
      } catch (err) {
        setError('Failed to create session')
        console.error('Error creating session:', err)
      }
    }
  }

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
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
                  <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-xl dark:shadow-blue-500/20">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                  <span className="text-blue-600 dark:text-blue-400">Sessions</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                  Create and manage your badminton tournaments and matches
                </p>
              </motion.div>
              
              <FadeIn delay={0.4}>
                <div className="flex justify-center">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-t border-blue-300/50 dark:shadow-blue-500/30 dark:hover:shadow-blue-500/40" disabled={players.length < 4}>
                          <CalendarPlus className="mr-2 h-5 w-5" />
                          Create New Session
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="w-[92vw] max-w-[560px] sm:max-w-md px-4 sm:px-6 rounded-2xl dark:bg-white/95 dark:shadow-white/30">
                      <DialogHeader>
                        <DialogTitle className="dark:text-slate-900">Create New Session</DialogTitle>
                        <DialogDescription className="dark:text-slate-700">
                          Select players and date for your badminton session.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <Label htmlFor="date" className="dark:text-slate-900">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          className="dark:bg-gray-100 dark:text-slate-900 dark:border-gray-300"
                        />

                        <div className="space-y-2">
                          <Label className="dark:text-slate-900">Select Players (minimum 4)</Label>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {players.map((player) => (
                              <div key={player.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={player.id}
                                  checked={selectedPlayers.includes(player.id)}
                                  onCheckedChange={() => togglePlayerSelection(player.id)}
                                />
                                <Label htmlFor={player.id} className="dark:text-slate-800">{player.name}</Label>
                              </div>
                            ))}
                          </div>
                          {players.length === 0 && (
                            <p className="text-sm text-slate-600 dark:text-slate-700">
                              No players available. Add players first.
                            </p>
                          )}
                          <div className="mt-4 space-y-3 border rounded-lg p-3 bg-slate-50/60 dark:bg-white">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-800">Player groups</p>
                              <span className="text-xs text-slate-500">{playerGroups.length} saved</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Input
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                              />
                              <Button
                                variant="outline"
                                onClick={saveCurrentGroup}
                                disabled={!groupName.trim() || selectedPlayers.length === 0}
                              >
                                Save selection
                              </Button>
                            </div>
                            {playerGroups.length > 0 ? (
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {playerGroups.map((group) => (
                                  <div
                                    key={group.id}
                                    className="flex items-center justify-between rounded-md border px-3 py-2 bg-white"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-slate-800">{group.name}</p>
                                      <p className="text-xs text-slate-500">{group.players.length} players</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="secondary" onClick={() => applyGroup(group)}>
                                        Apply
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeGroup(group.id)}
                                        className="h-8 w-8 text-slate-500"
                                        aria-label="Remove group"
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">Save your current selection as a preset to reuse later.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={createSession} disabled={selectedPlayers.length < 4} className="bg-blue-500 hover:bg-blue-600">
                          Create Session ({selectedPlayers.length} players)
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {players.length < 4 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-slate-500 dark:text-slate-400 mt-4"
                  >
                    You need at least 4 players to create a session
                  </motion.p>
                )}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-700">Loading sessions...</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        ) : sessions.length === 0 ? (
          <FadeIn delay={0.6}>
            <div className="max-w-2xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="mb-6"
                  >
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 dark:from-blue-200 dark:to-blue-300">
                      <CalendarPlus className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-900">Ready to play?</h3>
                    <p className="text-slate-600 dark:text-slate-700 mb-6 text-lg">Create your first session to start organizing matches</p>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)} 
                      size="lg"
                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={players.length < 4}
                    >
                      <CalendarPlus className="mr-2 h-5 w-5" />
                      Create Your First Session
                    </Button>
                    {players.length < 4 && (
                      <p className="text-sm text-slate-500 dark:text-slate-600 mt-4">
                        You need at least 4 players to create a session
                      </p>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        ) : (
          <>
            {/* Stats Overview */}
            <FadeIn delay={0.6}>
              <div className="grid gap-6 md:grid-cols-3 mb-12">
                <AnimatedCard delay={0.1}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Total Sessions</CardTitle>
                      <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-blue-500/20">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">{sessions.length}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Sessions played</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Games Played</CardTitle>
                      <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-purple-500/20">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">
                        {sessions.reduce((total, session) => total + session.games.filter(g => g.completed).length, 0)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Completed games</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                <AnimatedCard delay={0.3}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Latest Session</CardTitle>
                      <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-emerald-500/20">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-900">
                        {sessions.length > 0 ? new Date(Math.max(...sessions.map(s => new Date(s.date).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Most recent</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </div>
            </FadeIn>

            {/* Sessions List */}
            <FadeIn delay={0.8}>
              <div className="space-y-6">
                <AnimatePresence>
                  { [...sessions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1, duration: 0.6 }}
                        whileHover={{ y: -2 }}
                        className="group"
                      >
                        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50">
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                              <div className="flex items-start space-x-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg dark:shadow-blue-500/20">
                                  {new Date(session.date).getDate()}
                                </div>
                                <div>
                                  <CardTitle className="text-xl text-slate-800 dark:text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {new Date(session.date).toLocaleDateString('en-US', { 
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </CardTitle>
                                  <CardDescription className="text-slate-600 dark:text-slate-700 mt-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
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
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Link href={`/sessions/${session.id}`}>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button variant="outline" className="w-full sm:w-auto bg-white/50 hover:bg-white/80 border-slate-300/50 hover:border-blue-300 text-slate-700 hover:text-blue-600 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-100/80 dark:hover:bg-slate-100 dark:text-slate-800 dark:border-slate-400/50">
                                      <Target className="mr-2 h-4 w-4" />
                                      Manage Session
                                    </Button>
                                  </motion.div>
                                </Link>
                                <Link href={`/stats?sessionId=${session.id}`}>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button variant="ghost" className="w-full sm:w-auto text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400">
                                      View Stats
                                    </Button>
                                  </motion.div>
                                </Link>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-800">Players:</p>
                              <div className="flex flex-wrap gap-2">
                                {session.players.map((playerId) => (
                                  <motion.span
                                    key={playerId}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-100 hover:to-blue-200 text-slate-700 hover:text-blue-700 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md dark:from-slate-200 dark:to-slate-300 dark:text-slate-800 dark:hover:from-blue-200 dark:hover:to-blue-300"
                                  >
                                    {getPlayerName(playerId)}
                                  </motion.span>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </div>
  )
}
