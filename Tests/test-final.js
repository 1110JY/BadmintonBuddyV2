// Direct test of our service functions with the correct setup
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Mock device ID function
function getDeviceId() {
  return 'test_device_final_' + Date.now()
}

// Replicate our playerService.create function
async function createPlayer(name) {
  const deviceId = getDeviceId()
  
  // Generate a timestamp-based ID like the existing data
  const id = Date.now().toString()
  
  // Try to create with device_id
  let { data, error } = await supabase
    .from('players')
    .insert({ id, name, device_id: deviceId })
    .select()
    .single()
  
  // If device_id column doesn't exist, create without it
  if (error && error.message.includes('column "device_id" does not exist')) {
    console.log('Creating player without device_id (legacy mode)')
    const fallback = await supabase
      .from('players')
      .insert({ id, name })
      .select()
      .single()
    data = fallback.data
    error = fallback.error
  }
  
  if (error) throw error
  return data
}

async function testFinalPlayerCreation() {
  try {
    console.log('🧪 Testing final player creation logic...')
    
    const result = await createPlayer('Final Test Player')
    console.log('✅ Player created successfully:', result)
    
    // Test fetching all players for this device
    const deviceId = result.device_id
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .eq('device_id', deviceId)
    
    if (fetchError) {
      console.error('❌ Error fetching players:', fetchError)
    } else {
      console.log('✅ Players for this device:', players)
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
    console.error('Error details:', JSON.stringify(err, null, 2))
  }
}

testFinalPlayerCreation()