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
import { Shuffle, Edit, Save, Download, Trash2, X, Share2, Copy, Check, CheckCircle2 } from "lucide-react"
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
  rotation?: number
}

export default function SessionDetailPage() {

  // Returns how many games a pair has played together on the same team
  const getPairGamesPlayedCount = (playerA: string, playerB: string, rotation?: number) => {
    if (!session || !playerA || !playerB) return 0;
    return session.games.filter((game: Game) => {
      const inRotation = rotation ? ((game.rotation ?? 1) === rotation) : true
      return inRotation && (
        (game.team1.includes(playerA) && game.team1.includes(playerB)) ||
        (game.team2.includes(playerA) && game.team2.includes(playerB))
      )
    }).length;
  }
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
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

  const getActiveRotation = () => {
    if (!session || session.games.length === 0) return 1
    return Math.max(...session.games.map((g) => g.rotation ?? 1))
  }

  const getGamesPlayedCount = (playerId: string, rotation?: number) => {
    if (!session) return 0
    return session.games
      .filter((game) => rotation ? (game.rotation ?? 1) === rotation : true)
      .reduce((count, game) => (
        count + (game.team1.includes(playerId) || game.team2.includes(playerId) ? 1 : 0)
      ), 0)
  }

  // Determine if all unique pairs have played together at least once for a rotation
  const haveAllPairsPlayedTogether = (rotation: number) => {
    if (!session || session.players.length < 2) return false
    const requiredPairs = new Set<string>()
    for (let i = 0; i < session.players.length; i++) {
      for (let j = i + 1; j < session.players.length; j++) {
        const key = [session.players[i], session.players[j]].sort().join("-")
        requiredPairs.add(key)
      }
    }

    const playedPairs = new Set<string>()
    session.games
      .filter((game) => (game.rotation ?? 1) === rotation)
      .forEach((game) => {
        const pairs = [
          [game.team1[0], game.team1[1]],
          [game.team2[0], game.team2[1]],
        ]
        pairs.forEach(([a, b]) => {
          const key = [a, b].sort().join("-")
          playedPairs.add(key)
        })
      })

    return Array.from(requiredPairs).every((pair) => playedPairs.has(pair))
  }

  // Ensure everyone has played roughly the same number of games (within 1 game spread) for a rotation
  const isGameCountBalanced = (rotation: number) => {
    if (!session || session.players.length === 0) return false
    const counts = session.players.map((pid) => getGamesPlayedCount(pid, rotation))
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    return max - min <= 1
  }

  const activeRotation = getActiveRotation()
  const rotationComplete = haveAllPairsPlayedTogether(activeRotation) && isGameCountBalanced(activeRotation)
  const nextRotation = rotationComplete ? activeRotation + 1 : activeRotation
  const rotationCount = session?.games.length ? Math.max(...session.games.map((g) => g.rotation ?? 1)) : 1

  const gamesByRotation = () => {
    if (!session) return []
    const grouped: Record<number, Game[]> = {}
    session.games.forEach((game) => {
      const rotation = game.rotation ?? 1
      grouped[rotation] = grouped[rotation] ? [...grouped[rotation], game] : [game]
    })
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((rotation) => ({ rotation, games: grouped[rotation] }))
  }

  // Return Tailwind classes for a badge color based on games played (0..9+)
  const getBadgeClasses = (count: number) => {
    const idx = Math.max(0, Math.min(count, 9))
    const classes = [
      'bg-emerald-50 text-emerald-800 border-emerald-100', // 0
      'bg-emerald-100 text-emerald-800 border-emerald-200', // 1
      'bg-emerald-200 text-emerald-900 border-emerald-300', // 2
      'bg-emerald-300 text-emerald-900 border-emerald-400', // 3
      'bg-amber-100 text-amber-800 border-amber-200',       // 4
      'bg-amber-200 text-amber-900 border-amber-300',       // 5
      'bg-amber-300 text-amber-900 border-amber-400',       // 6
      'bg-red-100 text-red-700 border-red-200',             // 7
      'bg-red-200 text-red-800 border-red-300',             // 8
      'bg-red-300 text-red-900 border-red-400',             // 9+
    ]
    return classes[idx]
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

  const generateShareableImage = async () => {
    if (!session || typeof window === "undefined") return
    setIsGeneratingImage(true)
    try {
      const canvas = document.createElement("canvas")
      // WhatsApp-friendly portrait card (simpler, mobile-first)
      const width = 900
      const height = 1600
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")

      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        const radius = Math.min(r, w / 2, h / 2)
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + w - radius, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
        ctx.lineTo(x + w, y + h - radius)
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
        ctx.lineTo(x + radius, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }

      // Background (soft)
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(0, 0, width, height)

      // Card container (clean white, compact)
      ctx.fillStyle = "#ffffff"
      roundRect(32, 32, width - 64, height - 64, 24)
      ctx.fill()

      // Completed games only
      const completedGames = session.games.filter((g) => g.completed)

      // Player stats (wins/losses, win rate, points diff)
      const playerStats = session.players.map((pid) => {
        let wins = 0
        let losses = 0
        let pointsDiff = 0
        completedGames.forEach((game) => {
          const onTeam1 = game.team1.includes(pid)
          const onTeam2 = game.team2.includes(pid)
          if (!onTeam1 && !onTeam2) return
          const teamScore = onTeam1 ? game.score1 : game.score2
          const oppScore = onTeam1 ? game.score2 : game.score1
          pointsDiff += teamScore - oppScore
          if (teamScore > oppScore) wins += 1
          else if (teamScore < oppScore) losses += 1
        })
        const games = wins + losses
        const winRate = games > 0 ? Math.round((wins / games) * 1000) / 10 : 0
        return { id: pid, name: getPlayerName(pid), wins, losses, games, winRate, pointsDiff }
      }).sort((a, b) => b.winRate - a.winRate || b.games - a.games)

      // Pair stats (top 3 by win rate/games)
      const pairMap: Record<string, { wins: number; games: number; points: number; names: string }> = {}
      completedGames.forEach((game) => {
        const teams = [
          { ids: game.team1, score: game.score1, oppScore: game.score2 },
          { ids: game.team2, score: game.score2, oppScore: game.score1 },
        ]
        teams.forEach(({ ids, score, oppScore }) => {
          const key = [...ids].sort().join("-")
          const names = ids.map(getPlayerName).sort().join(" & ")
          if (!pairMap[key]) pairMap[key] = { wins: 0, games: 0, points: 0, names }
          pairMap[key].games += 1
          pairMap[key].points += score
          if (score > oppScore) pairMap[key].wins += 1
        })
      })
      const pairStats = Object.values(pairMap).map((p) => {
        const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 1000) / 10 : 0
        const avgPoints = p.games > 0 ? Math.round((p.points / p.games) * 10) / 10 : 0
        return { ...p, winRate, avgPoints }
      }).sort((a, b) => b.winRate - a.winRate || b.games - a.games).slice(0, 3)

      const padding = 64
      const contentWidth = width - padding * 2

      // Header area (light card)
      roundRect(padding, padding, contentWidth, 140, 20)
      ctx.fillStyle = "#f4f6fb"
      ctx.fill()
      ctx.fillStyle = "#0f172a"
      ctx.font = "40px 'Segoe UI', sans-serif"
      ctx.fillText("Match Recap", padding + 20, padding + 60)
      ctx.fillStyle = "#475569"
      ctx.font = "24px 'Segoe UI', sans-serif"
      ctx.fillText(new Date(session.date).toLocaleDateString(), padding + 20, padding + 95)
      ctx.fillStyle = "#6b7280"
      ctx.font = "20px 'Segoe UI', sans-serif"
      ctx.fillText(`${completedGames.length} of ${session.games.length} games completed`, padding + 20, padding + 124)

      // Player statistics block (single column)
      const statsY = padding + 180
      ctx.fillStyle = "#0f172a"
      ctx.font = "30px 'Segoe UI', sans-serif"
      ctx.fillText("Player Statistics", padding, statsY)
      ctx.fillStyle = "#6b7280"
      ctx.font = "20px 'Segoe UI', sans-serif"
      ctx.fillText("Performance summary for all players", padding, statsY + 30)

      const tableStartY = statsY + 54
      const colX = [padding, padding + 220, padding + 420]
      ctx.fillStyle = "#0f172a"
      ctx.font = "20px 'Segoe UI', sans-serif"
      ctx.fillText("Player", colX[0], tableStartY)
      ctx.fillText("W/L", colX[1], tableStartY)
      ctx.fillText("Win Rate", colX[2], tableStartY)
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, tableStartY + 10)
      ctx.lineTo(padding + contentWidth, tableStartY + 10)
      ctx.stroke()

      ctx.font = "20px 'Segoe UI', sans-serif"
      playerStats.slice(0, 10).forEach((p, idx) => {
        const y = tableStartY + 36 + idx * 34
        ctx.fillStyle = "#0f172a"
        ctx.fillText(p.name, colX[0], y)
        ctx.fillText(`${p.wins}/${p.losses}`, colX[1], y)
        ctx.fillStyle = "#2563eb"
        ctx.fillText(`${p.winRate.toFixed(1)}%`, colX[2], y)
      })

      // Pair rankings block (stacked light cards)
      const pairsY = tableStartY + 36 + Math.min(playerStats.length, 10) * 34 + 32
      ctx.fillStyle = "#0f172a"
      ctx.font = "26px 'Segoe UI', sans-serif"
      ctx.fillText("Top Pairs", padding, pairsY)
      ctx.fillStyle = "#6b7280"
      ctx.font = "18px 'Segoe UI', sans-serif"
      ctx.fillText("Win rate + games played", padding, pairsY + 26)

      const pairCardWidth = contentWidth
      const pairRowStart = pairsY + 46
      const pairRowHeight = 90
      if (pairStats.length === 0) {
        ctx.fillStyle = "#6b7280"
        ctx.font = "18px 'Segoe UI', sans-serif"
        ctx.fillText("No completed games yet", padding, pairRowStart + 24)
      } else {
        pairStats.forEach((pair, idx) => {
          const rowY = pairRowStart + idx * (pairRowHeight + 12)
          roundRect(padding, rowY, pairCardWidth, pairRowHeight, 14)
          ctx.fillStyle = "#f7f8fb"
          ctx.fill()

          ctx.fillStyle = "#0f172a"
          ctx.font = "20px 'Segoe UI', sans-serif"
          ctx.fillText(`${pair.names}`, padding + 16, rowY + 28)
          ctx.fillStyle = "#6b7280"
          ctx.font = "16px 'Segoe UI', sans-serif"
          ctx.fillText(`${pair.games} games`, padding + 16, rowY + 52)

          ctx.fillStyle = "#2563eb"
          ctx.font = "18px 'Segoe UI', sans-serif"
          ctx.fillText(`${pair.winRate.toFixed(1)}%`, padding + pairCardWidth - 140, rowY + 30)
          ctx.fillStyle = "#6b7280"
          ctx.font = "16px 'Segoe UI', sans-serif"
          ctx.fillText(`Avg ${pair.avgPoints}`, padding + pairCardWidth - 140, rowY + 54)
        })
      }

      // Games summary footer (compact)
      const footerY = height - 140
      ctx.fillStyle = "#0f172a"
      ctx.font = "26px 'Segoe UI', sans-serif"
      ctx.fillText("Games", padding, footerY)
      ctx.fillStyle = "#475569"
      ctx.font = "20px 'Segoe UI', sans-serif"
      ctx.fillText(`${completedGames.length} of ${session.games.length} completed`, padding, footerY + 30)

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `badminton-session-${session.date}.png`
      link.click()
    } catch (err) {
      console.error("Failed to generate image", err)
      alert("Could not generate image. Please try again.")
    } finally {
      setIsGeneratingImage(false)
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
        rotation: nextRotation,
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
      rotation: nextRotation,
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
              {session.players.length} players, {session.games.length} games, {rotationCount} rotation{rotationCount === 1 ? "" : "s"}
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
          <Button
            onClick={generateShareableImage}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isGeneratingImage}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingImage ? "Building Image..." : "Share Image"}
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
                        {session.players
                          .filter(pid => ![manualTeam1Player2, manualTeam2Player1, manualTeam2Player2].includes(pid) || pid === manualTeam1Player1)
                          .map((playerId) => {
                            const count = getGamesPlayedCount(playerId, nextRotation)
                            return (
                              <SelectItem key={playerId} value={playerId}>
                                <div className="flex items-center gap-2 w-full">
                                  <span className="truncate max-w-[12rem]">{getPlayerName(playerId)}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(count)}`}>
                                    {count}
                                  </span>
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                    <Select value={manualTeam1Player2} onValueChange={setManualTeam1Player2}>
                      <SelectTrigger><SelectValue placeholder="Player 2" /></SelectTrigger>
                      <SelectContent>
                        {session.players
                          .filter(pid => ![manualTeam1Player1, manualTeam2Player1, manualTeam2Player2].includes(pid) || pid === manualTeam1Player2)
                          .map((playerId) => {
                            const count = getGamesPlayedCount(playerId, nextRotation);
                            const pairCount = manualTeam1Player1 && playerId ? getPairGamesPlayedCount(manualTeam1Player1, playerId, nextRotation) : 0;
                            return (
                              <SelectItem key={playerId} value={playerId}>
                                <div className="flex items-center gap-2 w-full">
                                  <span className="truncate max-w-[12rem]">{getPlayerName(playerId)}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(count)}`}>
                                    {count}
                                  </span>
                                  {manualTeam1Player1 && playerId && (
                                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-0.5">
                                      Pair: {pairCount}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
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
                        {session.players
                          .filter(pid => ![manualTeam1Player1, manualTeam1Player2, manualTeam2Player2].includes(pid) || pid === manualTeam2Player1)
                          .map((playerId) => {
                            const count = getGamesPlayedCount(playerId, nextRotation)
                            return (
                              <SelectItem key={playerId} value={playerId}>
                                <div className="flex items-center gap-2 w-full">
                                  <span className="truncate max-w-[12rem]">{getPlayerName(playerId)}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(count)}`}>
                                    {count}
                                  </span>
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                    <Select value={manualTeam2Player2} onValueChange={setManualTeam2Player2}>
                      <SelectTrigger><SelectValue placeholder="Player 2" /></SelectTrigger>
                      <SelectContent>
                        {session.players
                          .filter(pid => ![manualTeam1Player1, manualTeam1Player2, manualTeam2Player1].includes(pid) || pid === manualTeam2Player2)
                          .map((playerId) => {
                            const count = getGamesPlayedCount(playerId, nextRotation);
                            const pairCount = manualTeam2Player1 && playerId ? getPairGamesPlayedCount(manualTeam2Player1, playerId, nextRotation) : 0;
                            return (
                              <SelectItem key={playerId} value={playerId}>
                                <div className="flex items-center gap-2 w-full">
                                  <span className="truncate max-w-[12rem]">{getPlayerName(playerId)}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(count)}`}>
                                    {count}
                                  </span>
                                  {manualTeam2Player1 && playerId && (
                                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-0.5">
                                      Pair: {pairCount}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={addManualPairing}
                  disabled={!(manualTeam1Player1 && manualTeam1Player2 && manualTeam2Player1 && manualTeam2Player2) || new Set([manualTeam1Player1, manualTeam1Player2, manualTeam2Player1, manualTeam2Player2]).size !== 4}
                >
                  Add Pairing
                </Button>
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

      {rotationComplete && (
        <div className="mb-6">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-semibold">Rotation {activeRotation} complete</p>
              <p className="text-sm text-emerald-800">
                Everyone has partnered at least once and games are balanced across players. New pairings will start set {nextRotation}.
              </p>
            </div>
          </div>
        </div>
      )}

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
                   {session.players.map((playerId) => {
                     // Count how many games this player appears in (completed or not)
                     const gamesPlayedCount = session.games.reduce((count, game) => (
                       count + (game.team1.includes(playerId) || game.team2.includes(playerId) ? 1 : 0)
                     ), 0)

                     return (
                  <span key={playerId} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm flex items-center gap-2">
                    <span>{getPlayerName(playerId)}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(gamesPlayedCount)}`}>
                      {gamesPlayedCount}
                    </span>
                  </span>
                     )
                   })}
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
              <div className="space-y-6"> 
                {gamesByRotation().map(({ rotation, games }) => (
                  <div key={rotation} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-100"
                        >
                          Rotation {rotation}
                        </span>
                        {rotation === activeRotation && rotationComplete && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                            Complete
                          </span>
                        )}
                        {rotation === activeRotation && !rotationComplete && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            In progress
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {games.filter((g) => g.completed).length} of {games.length} games completed
                      </span>
                    </div>
                    <div className="space-y-4">
                      {games.map((game, index) => (
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
