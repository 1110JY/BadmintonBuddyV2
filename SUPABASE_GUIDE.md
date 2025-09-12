# Supabase Integration Setup Guide

## 🚀 Setup Instructions

### 1. Database Setup
1. Go to your Supabase Dashboard: https://app.supabase.com/project/gbpbutelwcabilrznwsz
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql` and run it
4. This will create the required tables and security policies

### 2. Environment Variables
Your environment variables are already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://gbpbutelwcabilrznwsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Database Schema

#### Players Table
- `id` (UUID, Primary Key)
- `name` (Text, Required)
- `created_at` (Timestamp)

#### Sessions Table
- `id` (UUID, Primary Key)
- `date` (Date, Required)
- `players` (Array of UUIDs)
- `games` (JSON Array)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 📚 Usage Examples

### Using the Player Service
```typescript
import { playerService } from '@/lib/supabase'

// Get all players
const players = await playerService.getAll()

// Create a new player
const newPlayer = await playerService.create("John Doe")

// Update a player
const updatedPlayer = await playerService.update(playerId, "Jane Doe")

// Delete a player
await playerService.delete(playerId)
```

### Using the Session Service
```typescript
import { sessionService } from '@/lib/supabase'

// Get all sessions
const sessions = await sessionService.getAll()

// Get a specific session
const session = await sessionService.getById(sessionId)

// Create a new session
const newSession = await sessionService.create({
  date: '2024-01-15',
  players: [playerId1, playerId2, playerId3, playerId4],
  games: []
})

// Update a session
const updatedSession = await sessionService.update(sessionId, {
  games: updatedGames
})
```

## 🔄 Migration from localStorage

To migrate your existing localStorage data to Supabase:

1. Export your current data from localStorage
2. Use the service functions to insert the data into Supabase
3. Update your components to use Supabase instead of localStorage

## 🔒 Security

- Row Level Security (RLS) is enabled
- Currently set to allow all operations (modify policies as needed)
- Environment variables are properly secured in .env.local

## 🎯 Next Steps

1. Run the SQL setup script in Supabase
2. Test the connection by accessing your pages
3. Gradually migrate your components from localStorage to Supabase
4. Add proper error handling and loading states