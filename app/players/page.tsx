"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Trash2, UserPlus, Edit, Users, Calendar, Trophy, Zap } from "lucide-react"
import { FadeIn } from "@/components/animated/fade-in"
import { AnimatedCard } from "@/components/animated/animated-card"
import { playerService } from "@/lib/supabase"
import { migrationService } from "@/lib/migration"

interface Player {
  id: string
  name: string
  created_at: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null)

  const loadPlayers = async () => {
    try {
      setLoading(true)
      
      // First, check and run migration if needed
      const migrationResult = await migrationService.checkAndMigrate()
      if (migrationResult.migrated) {
        setMigrationStatus(`Successfully migrated ${migrationResult.playersCount} players and ${migrationResult.sessionsCount} sessions from localStorage to Supabase!`)
      } else if (migrationResult.error) {
        console.warn('Migration warning:', migrationResult.error)
        setMigrationStatus(`Migration warning: ${migrationResult.error}`)
      }
      
      const data = await playerService.getAll()
      setPlayers(data)
      setError(null)
    } catch (err) {
      setError('Failed to load players')
      console.error('Error loading players:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [])

  const addPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const newPlayer = await playerService.create(newPlayerName.trim())
        setPlayers(prev => [...prev, newPlayer])
        setNewPlayerName("")
        setIsAddDialogOpen(false)
        setError(null)
      } catch (err) {
        setError('Failed to add player')
        console.error('Error adding player:', err)
      }
    }
  }

  const deletePlayer = async (playerId: string) => {
    try {
      await playerService.delete(playerId)
      setPlayers(prev => prev.filter(player => player.id !== playerId))
      setError(null)
    } catch (err) {
      setError('Failed to delete player')
      console.error('Error deleting player:', err)
    }
  }

  const startEdit = (player: Player) => {
    setEditingPlayer(player)
    setEditName(player.name)
    setIsEditDialogOpen(true)
  }

  const saveEdit = async () => {
    if (editingPlayer && editName.trim()) {
      try {
        const updatedPlayer = await playerService.update(editingPlayer.id, editName.trim())
        setPlayers(prev => prev.map(player => 
          player.id === editingPlayer.id ? updatedPlayer : player
        ))
        setEditingPlayer(null)
        setEditName("")
        setIsEditDialogOpen(false)
        setError(null)
      } catch (err) {
        setError('Failed to update player')
        console.error('Error updating player:', err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 dark:from-emerald-400/5 dark:to-blue-400/5" />
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
                  <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl dark:shadow-emerald-500/20">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                  <span className="text-emerald-600 dark:text-emerald-400">Players</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                  Manage your badminton club members and build your team
                </p>
              </motion.div>
              
              <FadeIn delay={0.4}>
                <div className="flex justify-center">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="text-lg px-8 py-6 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-t border-emerald-300/50 dark:shadow-emerald-500/30 dark:hover:shadow-emerald-500/40">
                          <UserPlus className="mr-2 h-5 w-5" />
                          Add New Player
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md w-full dark:bg-white/95 dark:shadow-white/30">
                      <DialogHeader>
                        <DialogTitle className="dark:text-slate-900">Add New Player</DialogTitle>
                        <DialogDescription className="dark:text-slate-700">Enter the name of the new player to add to your club.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <Label htmlFor="name" className="dark:text-slate-900">Name</Label>
                        <Input
                          id="name"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Enter player name"
                          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                          className="dark:bg-gray-100 dark:text-slate-900 dark:border-gray-300"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="bg-emerald-500 hover:bg-emerald-600">
                          Add Player
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 -mt-8 relative z-10">
        {/* Migration Success Message */}
        {migrationStatus && (
          <FadeIn delay={0.2}>
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-200">Data Migration Complete!</p>
                      <p className="text-emerald-700 dark:text-emerald-300 text-sm">{migrationStatus}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Your original data has been safely backed up in localStorage and is now available in Supabase. 
                      You can now access your badminton data from any device!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        )}

        {/* Error Message */}
        {error && (
          <FadeIn delay={0.4}>
            <div className="max-w-2xl mx-auto mb-8">
              <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="py-4">
                  <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
                  <div className="flex justify-center mt-2">
                    <Button onClick={loadPlayers} variant="outline" size="sm">
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-700">Loading players...</p>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        ) : players.length === 0 ? (
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
                    <div className="h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 dark:from-emerald-200 dark:to-emerald-300">
                      <UserPlus className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-900">Ready to build your team?</h3>
                    <p className="text-slate-600 dark:text-slate-700 mb-6 text-lg">Add your first player to get started with organizing your badminton sessions</p>
                    <Button 
                      onClick={() => setIsAddDialogOpen(true)} 
                      size="lg"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <UserPlus className="mr-2 h-5 w-5" />
                      Add Your First Player
                    </Button>
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
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Total Players</CardTitle>
                      <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-emerald-500/20">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-900">{players.length}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Active members</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                <AnimatedCard delay={0.2}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Latest Join</CardTitle>
                      <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-blue-500/20">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-900">
                        {players.length > 0 ? new Date(Math.max(...players.map(p => new Date(p.created_at).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Most recent</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>

                <AnimatedCard delay={0.3}>
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-white/95 dark:shadow-white/30 dark:hover:shadow-white/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-700">Team Status</CardTitle>
                      <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg dark:shadow-purple-500/20">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-900">
                        {players.length >= 4 ? 'Ready' : 'Building'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
                        {players.length >= 4 ? 'For matches' : `Need ${4 - players.length} more`}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </div>
            </FadeIn>

            {/* Players Grid */}
            <FadeIn delay={0.8}>
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      whileHover={{ y: -4 }}
                      className="group"
                    >
                      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:bg-white/90 dark:bg-white/95 dark:group-hover:bg-white dark:shadow-white/30 dark:hover:shadow-white/50 h-full">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg dark:shadow-emerald-500/20">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <CardTitle className="text-xl text-slate-800 dark:text-slate-900 group-hover:text-emerald-600 transition-colors">
                                  {player.name}
                                </CardTitle>
                                <CardDescription className="text-slate-600 dark:text-slate-700 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Joined {new Date(player.created_at).toLocaleDateString()}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => startEdit(player)}
                                  className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-700 dark:hover:text-blue-600 dark:hover:bg-blue-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deletePlayer(player.id)}
                                  className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-700 dark:hover:text-red-600 dark:hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-600">Member since</span>
                            <span className="text-slate-700 dark:text-slate-800 font-medium">
                              {new Date(player.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md w-full dark:bg-white/95 dark:shadow-white/30">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-900">Edit Player</DialogTitle>
            <DialogDescription className="dark:text-slate-700">Update the player's name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="editName" className="dark:text-slate-900">Name</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className="dark:bg-gray-100 dark:text-slate-900 dark:border-gray-300"
            />
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={!editName.trim()} className="bg-emerald-500 hover:bg-emerald-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
