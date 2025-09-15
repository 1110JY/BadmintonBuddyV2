// Test session loading
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Mock device ID function
function getDeviceId() {
  return 'legacy_device_migration' // Test with legacy data
}

// Test sessionService.getById
async function testSessionById() {
  try {
    console.log('🧪 Testing session retrieval...')
    
    // First, get all sessions to see what IDs we have
    const { data: allSessions, error: allError } = await supabase
      .from('sessions')
      .select('*')
      .limit(3)
    
    if (allError) {
      console.error('❌ Error getting all sessions:', allError)
      return
    }
    
    console.log('📋 Available sessions:', allSessions.map(s => ({ id: s.id, date: s.date, device_id: s.device_id })))
    
    if (allSessions.length === 0) {
      console.log('ℹ️  No sessions found in database')
      return
    }
    
    // Test getting a specific session by ID
    const testSessionId = allSessions[0].id
    console.log(`\n🎯 Testing getById with session ID: ${testSessionId}`)
    
    const deviceId = getDeviceId()
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', testSessionId)
      .eq('device_id', deviceId)
      .single()
    
    if (error) {
      console.error('❌ Error getting session by ID:', error)
      
      // Try without device_id filter
      console.log('\n🔄 Trying without device_id filter...')
      const { data: sessionNoFilter, error: errorNoFilter } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', testSessionId)
        .single()
      
      if (errorNoFilter) {
        console.error('❌ Error even without device filter:', errorNoFilter)
      } else {
        console.log('✅ Session found without device filter:', sessionNoFilter)
        console.log(`   Session device_id: ${sessionNoFilter.device_id}`)
        console.log(`   Looking for device_id: ${deviceId}`)
      }
    } else {
      console.log('✅ Session found with device filter:', session)
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testSessionById()