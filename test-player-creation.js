// Test player creation with device_id
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple device ID function for testing
function getTestDeviceId() {
  return 'test_device_' + Date.now()
}

async function testPlayerCreation() {
  try {
    console.log('Testing player creation...')
    
    const deviceId = getTestDeviceId()
    console.log('Using device ID:', deviceId)
    
    // Test creating a player with manual ID
    const playerId = Date.now().toString()
    const { data, error } = await supabase
      .from('players')
      .insert({ 
        id: playerId,
        name: 'Test Player ' + Date.now(), 
        device_id: deviceId 
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating player:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Successfully created player:', data)
    }

    // Test fetching players with device_id
    console.log('\nTesting fetch with device_id...')
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('*')
      .eq('device_id', deviceId)
    
    if (fetchError) {
      console.error('❌ Error fetching players:', fetchError)
    } else {
      console.log('✅ Players for device:', players)
    }

    // Test fetching all players to see the structure
    console.log('\nChecking all players structure...')
    const { data: allPlayers, error: allError } = await supabase
      .from('players')
      .select('*')
      .limit(3)
    
    if (allError) {
      console.error('❌ Error fetching all players:', allError)
    } else {
      console.log('✅ Sample players:', allPlayers)
      if (allPlayers.length > 0) {
        console.log('Player structure:', Object.keys(allPlayers[0]))
      }
    }
    
  } catch (err) {
    console.error('Test failed:', err)
  }
}

testPlayerCreation()