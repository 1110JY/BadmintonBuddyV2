// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...')
    const { data, error } = await supabase.from('players').select('*').limit(1)
    
    if (error) {
      console.error('Error details:', error)
      if (error.message.includes('relation "players" does not exist')) {
        console.log('\n❌ Tables do not exist in database!')
        console.log('📋 You need to run the SQL setup script in Supabase first.')
        console.log('   Go to: https://supabase.com/dashboard/project/gbpbutelwcabilrznwsz/sql')
        console.log('   And paste the contents of supabase-setup.sql')
      }
    } else {
      console.log('✅ Successfully connected to players table')
      console.log('Data:', data)
    }

    console.log('\n2. Testing sessions table...')
    const { data: sessionsData, error: sessionsError } = await supabase.from('sessions').select('*').limit(1)
    
    if (sessionsError) {
      console.error('Sessions error:', sessionsError)
    } else {
      console.log('✅ Successfully connected to sessions table')
      console.log('Sessions data:', sessionsData)
    }

  } catch (err) {
    console.error('Connection test failed:', err)
  }
}

testConnection()