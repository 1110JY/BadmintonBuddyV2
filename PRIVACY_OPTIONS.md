# 🔐 Private Data Setup with User Authentication

## Option 1: User Authentication (Recommended)

This adds user accounts so each person's data is completely private.

### Database Changes Needed:
```sql
-- Add user_id column to existing tables
ALTER TABLE players ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update Row Level Security policies
DROP POLICY "Enable all operations for players" ON players;
DROP POLICY "Enable all operations for sessions" ON sessions;

-- New policies for user-specific data
CREATE POLICY "Users can only see their own players" ON players
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own sessions" ON sessions  
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Code Changes Needed:
```typescript
// Update service functions to include user_id
export const playerService = {
  async getAll() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async create(name: string) {
    const user = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('players')
      .insert({ name, user_id: user.data.user?.id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  // ... similar updates for other methods
}
```

### User Experience:
- Users sign up/login with email
- Each user sees only their own players and sessions
- Data is completely isolated
- Can add features like password reset, profile management

---

## Option 2: Browser-Based Privacy (Simpler)

Keep the current setup but make data "private" per browser/device.

### How it works:
- Generate unique device ID per browser
- Store device_id instead of user_id
- Each browser/device has separate data
- No login required

### Database Changes:
```sql
-- Add device_id instead of user_id
ALTER TABLE players ADD COLUMN device_id TEXT;
ALTER TABLE sessions ADD COLUMN device_id TEXT;

-- Update policies for device-based privacy
CREATE POLICY "Device-specific players" ON players
FOR ALL USING (device_id = current_setting('app.device_id')) 
WITH CHECK (device_id = current_setting('app.device_id'));
```

### Code Changes:
```typescript
// Generate/get device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('badminton-device-id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('badminton-device-id', deviceId)
  }
  return deviceId
}

// Use device ID in queries
export const playerService = {
  async getAll() {
    const deviceId = getDeviceId()
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}
```

### Pros:
- ✅ No login required
- ✅ Privacy per device/browser
- ✅ Simple to implement

### Cons:
- ❌ Data tied to specific browser
- ❌ Clear browser data = lose everything
- ❌ Can't access from multiple devices

---

## Option 3: Shared Club Data (Current)

Keep current setup for shared club/group usage.

### Best for:
- Single badminton club
- Family/friend groups  
- Small communities sharing players

### Pros:
- ✅ Everyone sees all players
- ✅ Collaborative session management
- ✅ Shared statistics and leaderboards

### Cons:
- ❌ No privacy between users
- ❌ Anyone can modify anyone's data