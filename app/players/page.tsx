"use client"

import { useState, useEffect } from "react"
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
import { Trash2, UserPlus, Edit } from "lucide-react"

interface Player {
  id: string
  name: string
  createdAt: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editName, setEditName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const savedPlayers = localStorage.getItem("badminton-players")
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers))
    }
  }, [])

  const savePlayersToStorage = (updatedPlayers: Player[]) => {
    localStorage.setItem("badminton-players", JSON.stringify(updatedPlayers))
    setPlayers(updatedPlayers)
  }

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        createdAt: new Date().toISOString(),
      }
      const updatedPlayers = [...players, newPlayer]
      savePlayersToStorage(updatedPlayers)
      setNewPlayerName("")
      setIsAddDialogOpen(false)
    }
  }

  const deletePlayer = (playerId: string) => {
    const updatedPlayers = players.filter((player) => player.id !== playerId)
    savePlayersToStorage(updatedPlayers)
  }

  const startEdit = (player: Player) => {
    setEditingPlayer(player)
    setEditName(player.name)
    setIsEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (editingPlayer && editName.trim()) {
      const updatedPlayers = players.map((player) =>
        player.id === editingPlayer.id ? { ...player, name: editName.trim() } : player
      )
      savePlayersToStorage(updatedPlayers)
      setEditingPlayer(null)
      setEditName("")
      setIsEditDialogOpen(false)
    }
  }

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your badminton club members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>Enter the name of the new player to add to your club.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              />
            </div>
            <DialogFooter>
              <Button onClick={addPlayer} disabled={!newPlayerName.trim()}>
                Add Player
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No players yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">Add your first player to get started</p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Card key={player.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center gap-2 text-2xl">
                  <span className="truncate">{player.name}</span>
                  <div className="flex space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(player)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deletePlayer(player.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-sm">
                  Joined {new Date(player.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update the player's name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label htmlFor="editName">Name</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            />
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={!editName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
