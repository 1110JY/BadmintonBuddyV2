"use client"

import { useState, useEffect } from "react"
import { sessionService, playerService } from "@/lib/supabase"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, BarChart3, Zap, Target, Award } from "lucide-react"
import { FadeIn } from "@/components/animated/fade-in"
import { AnimatedCard } from "@/components/animated/animated-card"
import { CountUp, StaggerContainer, StaggerItem } from "@/components/animated/animations"

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
    async function fetchData() {
      try {
        const [playersData, sessionsData] = await Promise.all([
          playerService.getAll(),
          sessionService.getAll(),
        ])
        setPlayers(playersData)
        setSessions(sessionsData)
      } catch (err) {
        console.error("Failed to fetch stats:", err)
      }
    }
    fetchData()
  }, [])

  const totalGames = sessions.reduce((acc, session) => acc + session.games.length, 0)
  const completedGames = sessions.reduce(
    (acc, session) => acc + session.games.filter((game) => game.completed).length,
    0,
  )

  const thisWeekSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return sessionDate >= weekAgo
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <FadeIn delay={0.2}>
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mb-6"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                  <span className="text-blue-600 dark:text-blue-400">Badminton</span>
                  <br />
                  <span className="text-slate-800 dark:text-slate-100">Made Simple</span>
                </h1>
              </motion.div>
              
              <FadeIn delay={0.5}>
                <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                  Manage players, track sessions, and elevate your badminton game with
                  <br className="hidden sm:block" />
                  powerful analytics and seamless organisation.
                </p>
              </FadeIn>

              <FadeIn delay={0.7}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/sessions">
                      <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-t border-blue-300/50 dark:shadow-white/20 dark:hover:shadow-white/30">
                        <Zap className="mr-2 h-5 w-5" />
                        Start New Session
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href="/stats">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 border-t-white dark:border-gray-600 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 dark:shadow-white/30 dark:hover:shadow-white/40">
                        <BarChart3 className="mr-2 h-5 w-5" />
                        View Analytics
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Stats Cards */}
        <FadeIn delay={0.8}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16 -mt-8 relative z-10">
            <AnimatedCard delay={0.1} className="group">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Total Players</CardTitle>
                  <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg border-t border-blue-300/50 dark:shadow-blue-500/20">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">
                    <CountUp value={players.length} delay={1} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Active members</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Total Sessions</CardTitle>
                  <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg border-t border-purple-300/50 dark:shadow-purple-500/20">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">
                    <CountUp value={sessions.length} delay={1.2} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Sessions organized</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Games Played</CardTitle>
                  <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg border-t border-emerald-300/50 dark:shadow-emerald-500/20">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">
                    <CountUp value={completedGames} delay={1.4} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
                    {totalGames - completedGames} pending
                  </p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">This Week</CardTitle>
                  <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg border-t border-orange-300/50 dark:shadow-orange-500/20">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">
                    <CountUp value={thisWeekSessions} delay={1.6} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Recent sessions</p>
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </FadeIn>

        {/* Main Content Grid */}
        <StaggerContainer delay={1.8} className="grid gap-8 lg:grid-cols-3">
          <StaggerItem className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg border-t border-blue-300/50 dark:shadow-blue-500/20">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800 dark:text-slate-900">Quick Actions</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-700">Get started with common tasks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <Link href="/players">
                    <Button className="w-full justify-start h-14 text-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border shadow-md hover:shadow-lg transition-all duration-300 border-t-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-slate-800 dark:border-gray-300 dark:shadow-gray-400/20 dark:hover:shadow-gray-400/30" variant="outline">
                      <Users className="mr-3 h-5 w-5" />
                      Manage Players
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <Link href="/sessions">
                    <Button className="w-full justify-start h-14 text-lg bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-t border-blue-300/50 dark:shadow-blue-500/30 dark:hover:shadow-blue-500/40">
                      <Calendar className="mr-3 h-5 w-5" />
                      Create New Session
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <Link href="/stats">
                    <Button className="w-full justify-start h-14 text-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border shadow-md hover:shadow-lg transition-all duration-300 border-t-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-slate-800 dark:border-gray-300 dark:shadow-gray-400/20 dark:hover:shadow-gray-400/30" variant="outline">
                      <BarChart3 className="mr-3 h-5 w-5" />
                      View Statistics
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 h-full dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-t border-emerald-300/50 dark:shadow-emerald-500/20">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-800 dark:text-slate-900">Recent Sessions</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-700">Your latest activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 2.2, duration: 0.6 }}
                    >
                      <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-t border-slate-100 dark:bg-gray-200 dark:border-gray-100 dark:shadow-gray-400/20">
                        <Calendar className="h-8 w-8 text-slate-500 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-600 mb-4">No sessions yet</p>
                      <Link href="/sessions">
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 border-t border-blue-300/50 dark:shadow-blue-500/30 dark:hover:shadow-blue-500/40">
                          Create your first session
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions
                      .slice(-3)
                      .reverse()
                      .map((session, index) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.2 + index * 0.1, duration: 0.6 }}
                          whileHover={{ x: 4 }}
                          className="group"
                        >
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 border rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-300 group-hover:shadow-md dark:from-gray-100 dark:to-gray-200 dark:hover:from-gray-200 dark:hover:to-gray-300 dark:border-gray-300">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-900">
                                {new Date(session.date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-700">
                                {session.players.length} players, {session.games.length} games
                              </p>
                            </div>
                            <Link href={`/sessions/${session.id}`}>
                              <Button size="sm" variant="ghost" className="opacity-60 group-hover:opacity-100 transition-opacity dark:text-slate-700 dark:hover:text-slate-900">
                                View
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </div>
  )
}
