"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shuffle, Edit, Save, Download, Trash2, X, Share2, Copy, Check } from "lucide-react"
import { supabase, playerService, sessionService } from "@/lib/supabase"

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

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [players, setPlayers] = useState<Player[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [editScore1, setEditScore1] = useState("")
  const [editScore2, setEditScore2] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManualPairingOpen, setIsManualPairingOpen] = useState(false)
  const [manualTeam1Player1, setManualTeam1Player1] = useState("")
  const [manualTeam1Player2, setManualTeam1Player2] = useState("")
  const [manualTeam2Player1, setManualTeam2Player1] = useState("")
  const [manualTeam2Player2, setManualTeam2Player2] = useState("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load players and session from Supabase
        const [playersData, sessionData] = await Promise.all([
          playerService.getAll(),
          sessionService.getById(sessionId)
        ])

        setPlayers(playersData)
        setSession(sessionData)
      } catch (err) {
        console.error('Error loading session data:', err)
        setError('Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId])

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || "Unknown"
  }

  const saveSession = async (updatedSession: Session) => {
    try {
      const updated = await sessionService.update(sessionId, {
        date: updatedSession.date,
        players: updatedSession.players,
        games: updatedSession.games
      })
      setSession(updated)
    } catch (err) {
      console.error('Error saving session:', err)
      setError('Failed to save session')
    }
  }

  const shareSession = async () => {
    if (!session) {
      alert('No session loaded.');
      return;
    }
    setIsSharing(true);
    try {
      // Ensure all players exist in Supabase
      const playerPromises = players.map(async (player) => {
        const { error } = await supabase
          .from('players')
          .upsert({ 
            id: player.id, 
            name: player.name,
            created_at: player.createdAt 
          }, { 
            onConflict: 'id' 
          });
        if (error) {
          console.warn('Error upserting player:', error);
        }
      });
      await Promise.all(playerPromises);

      // Save session to Supabase
      // Always include device_id for privacy and RLS
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('badminton_buddy_device_id') : 'server_temp_id';
      const { data, error: sessionError } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          date: session.date,
          players: session.players,
          games: session.games,
          updated_at: new Date().toISOString(),
          device_id: deviceId || 'unknown_device'
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error upserting session:', sessionError);
        alert(`Failed to share session: ${sessionError.message || JSON.stringify(sessionError)}`);
        return;
      }
      if (!data || !data.id) {
        alert('Failed to share session: No session data returned.');
        return;
      }

      // Generate share link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/shared/${data.id}`;
      setShareLink(link);
      setIsShareDialogOpen(true);
    } catch (error) {
      console.error('Error sharing session:', error);
  alert(`Failed to share session: ${typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error)}`);
    } finally {
      setIsSharing(false);
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const generateRandomPairings = async () => {
    if (!session) return

    const availablePlayers = [...session.players]
    const newGames: Game[] = []

    for (let i = availablePlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availablePlayers[i], availablePlayers[j]] = [availablePlayers[j], availablePlayers[i]]
    }

    for (let i = 0; i < availablePlayers.length - 3; i += 4) {
      const newGame: Game = {
        id: Date.now().toString() + i,
        team1: [availablePlayers[i], availablePlayers[i + 1]],
        team2: [availablePlayers[i + 2], availablePlayers[i + 3]],
        score1: 0,
        score2: 0,
        completed: false,
      }
      newGames.push(newGame)
    }

    const updatedSession = { ...session, games: [...session.games, ...newGames] }
    await saveSession(updatedSession)
  }

  const addManualPairing = async () => {
    if (!session || !manualTeam1Player1 || !manualTeam1Player2 || !manualTeam2Player1 || !manualTeam2Player2) return

    const newGame: Game = {
      id: Date.now().toString(),
      team1: [manualTeam1Player1, manualTeam1Player2],
      team2: [manualTeam2Player1, manualTeam2Player2],
      score1: 0,
      score2: 0,
      completed: false,
    }

    const updatedSession = { ...session, games: [...session.games, newGame] }
    await saveSession(updatedSession)

    setManualTeam1Player1("")
    setManualTeam1Player2("")
    setManualTeam2Player1("")
    setManualTeam2Player2("")
    setIsManualPairingOpen(false)
  }

  const startEditScore = (game: Game) => {
    setEditingGame(game)
    setEditScore1(game.score1.toString())
    setEditScore2(game.score2.toString())
    setIsEditDialogOpen(true)
  }

  const saveScore = async () => {
    if (!session || !editingGame) return

    const updatedGames = session.games.map((game) =>
      game.id === editingGame.id
        ? {
            ...game,
            score1: Number.parseInt(editScore1) || 0,
            score2: Number.parseInt(editScore2) || 0,
            completed: true,
          }
        : game,
    )

    const updatedSession = { ...session, games: updatedGames }
    await saveSession(updatedSession)
    setIsEditDialogOpen(false)
    setEditingGame(null)
  }

  const deleteGame = async (gameId: string) => {
    if (!session) return

    const updatedGames = session.games.filter((game) => game.id !== gameId)
    const updatedSession = { ...session, games: updatedGames }
    await saveSession(updatedSession)
  }

  const deleteSession = async () => {
    try {
      await sessionService.delete(sessionId)
      window.location.href = "/sessions"
    } catch (err) {
      console.error('Error deleting session:', err)
      setError('Failed to delete session')
    }
  }

  const exportToCSV = () => {
    if (!session) return

    const csvContent = [
      ["Date", "Team 1 Player 1", "Team 1 Player 2", "Team 2 Player 1", "Team 2 Player 2", "Team 1 Score", "Team 2 Score", "Completed"],
      ...session.games.map((game) => [
        session.date,
        getPlayerName(game.team1[0]),
        getPlayerName(game.team1[1]),
        getPlayerName(game.team2[0]),
        getPlayerName(game.team2[1]),
        game.score1.toString(),
        game.score2.toString(),
        game.completed ? "Yes" : "No",
      ]),
    ].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `badminton-session-${session.date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading session...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return <div className="container mx-auto px-4 py-8">Session not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Session - {new Date(session.date).toLocaleDateString()}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {session.players.length} players, {session.games.length} games
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={shareSession} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={isSharing}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {isSharing ? "Sharing..." : "Share Session"}
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={generateRandomPairings} className="w-full sm:w-auto">
            <Shuffle className="mr-2 h-4 w-4" />
            Generate Pairings
          </Button>
          <Dialog open={isManualPairingOpen} onOpenChange={setIsManualPairingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Manual Pairing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Manual Pairing</DialogTitle>
                <DialogDescription>Select players for each team manually.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Team 1</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={manualTeam1Player1} onValueChange={setManualTeam1Player1}>
                      <SelectTrigger><SelectValue placeholder="Player 1" /></SelectTrigger>
                      <SelectContent>
                        {session.players.map((playerId) => (
                          <SelectItem key={playerId} value={playerId}>
                            {getPlayerName(playerId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={manualTeam1Player2} onValueChange={setManualTeam1Player2}>
                      <SelectTrigger><SelectValue placeholder="Player 2" /></SelectTrigger>
                      <SelectContent>
                        {session.players.map((playerId) => (
                          <SelectItem key={playerId} value={playerId}>
                            {getPlayerName(playerId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Team 2</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={manualTeam2Player1} onValueChange={setManualTeam2Player1}>
                      <SelectTrigger><SelectValue placeholder="Player 1" /></SelectTrigger>
                      <SelectContent>
                        {session.players.map((playerId) => (
                          <SelectItem key={playerId} value={playerId}>
                            {getPlayerName(playerId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={manualTeam2Player2} onValueChange={setManualTeam2Player2}>
                      <SelectTrigger><SelectValue placeholder="Player 2" /></SelectTrigger>
                      <SelectContent>
                        {session.players.map((playerId) => (
                          <SelectItem key={playerId} value={playerId}>
                            {getPlayerName(playerId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addManualPairing}>Add Pairing</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={deleteSession}
            variant="ghost"
            className="text-destructive w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Session
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Session
            </DialogTitle>
            <DialogDescription>
              Your session has been saved and can now be shared with others. Anyone with this link can view the session stats.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyToClipboard}
                size="icon"
                variant="outline"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {linkCopied && (
              <p className="text-sm text-green-600">Link copied to clipboard!</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsShareDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Players in Session</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {session.players.map((playerId) => (
                <span key={playerId} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {getPlayerName(playerId)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Games</CardTitle>
            <CardDescription>
              {session.games.filter((g) => g.completed).length} of {session.games.length} games completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.games.length === 0 ? (
              <p className="text-muted-foreground">No games yet. Generate pairings to start playing!</p>
            ) : (
              <div className="space-y-4"> 
                {session.games.map((game, index) => (
                  <div key={game.id} className="border rounded-lg p-4 space-y-2">
<div className="relative">
  {/* Delete (X) button in top-right */}
  <button
    onClick={() => deleteGame(game.id)}
    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition"
    aria-label="Delete Game"
  >
    <X className="w-4 h-4" />
  </button>

  {/* Game number and Edit/Add Score button */}
  <div className="flex justify-between items-center mb-2 pr-8">
    <h4 className="font-semibold">Game {index + 1}</h4>
    <Button size="sm" variant="outline" onClick={() => startEditScore(game)}>
      {game.completed ? "Edit Score" : "Add Score"}
    </Button>
  </div>
</div>


                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="font-medium">Team 1</p>
                        <p className="text-sm text-muted-foreground">{getPlayerName(game.team1[0])} & {getPlayerName(game.team1[1])}</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{game.score1} - {game.score2}</p>
                        {!game.completed && <p className="text-sm text-muted-foreground">Not played</p>}
                      </div>
                      <div>
                        <p className="font-medium">Team 2</p>
                        <p className="text-sm text-muted-foreground">{getPlayerName(game.team2[0])} & {getPlayerName(game.team2[1])}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game Score</DialogTitle>
            <DialogDescription>Enter the final scores for this game.</DialogDescription>
          </DialogHeader>
          {editingGame && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Team 1 Score</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    {getPlayerName(editingGame.team1[0])} & {getPlayerName(editingGame.team1[1])}
                  </p>
                  <Input type="number" value={editScore1} onChange={(e) => setEditScore1(e.target.value)} min="0" />
                </div>
                <div>
                  <Label>Team 2 Score</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    {getPlayerName(editingGame.team2[0])} & {getPlayerName(editingGame.team2[1])}
                  </p>
                  <Input type="number" value={editScore2} onChange={(e) => setEditScore2(e.target.value)} min="0" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveScore}>
              <Save className="mr-2 h-4 w-4" />
              Save Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
