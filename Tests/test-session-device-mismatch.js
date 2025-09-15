// Test with a new session that would have a different device ID
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Simulate a new device ID like what would happen in the browser
function getNewDeviceId() {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
}

async function testNewSessionScenario() {
  try {
    console.log('🧪 Testing new session creation and retrieval...')
    
    const newDeviceId = getNewDeviceId()
    console.log('📱 New device ID:', newDeviceId)
    
    // Create a session with new device ID (like when you create a new session)
    const sessionId = Date.now().toString()
    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        date: '2025-09-12',
        players: ['test1', 'test2', 'test3', 'test4'],
        games: [],
        device_id: newDeviceId
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating session:', createError)
      return
    }
    
    console.log('✅ Created session:', newSession)
    
    // Now try to retrieve it with a different device ID (simulate user going to different browser)
    const differentDeviceId = getNewDeviceId()
    console.log('📱 Different device ID:', differentDeviceId)
    
    const { data: retrievedSession, error: retrieveError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('device_id', differentDeviceId)
      .single()
    
    if (retrieveError) {
      console.log('❌ Expected error with different device ID:', retrieveError.message)
      
      // This should work - retrieving with correct device ID
      const { data: correctSession, error: correctError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('device_id', newDeviceId)
        .single()
      
      if (correctError) {
        console.error('❌ Unexpected error with correct device ID:', correctError)
      } else {
        console.log('✅ Session found with correct device ID:', correctSession)
      }
    } else {
      console.log('🤔 Unexpected: Session found with different device ID')
    }
    
    // Clean up
    await supabase.from('sessions').delete().eq('id', sessionId)
    console.log('🧹 Cleaned up test session')
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testNewSessionScenario()