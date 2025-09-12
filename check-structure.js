// Check current table structure
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    console.log('Checking table structure...')
    
    // Get table info
    const { data, error } = await supabase.rpc('get_table_info', {})
    
    if (error) {
      console.log('RPC not available, trying direct query...')
      
      // Try to get column information
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .limit(1)
      
      if (playersData && playersData.length > 0) {
        console.log('Players table columns:', Object.keys(playersData[0]))
      }
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .limit(1)
      
      if (sessionsData && sessionsData.length > 0) {
        console.log('Sessions table columns:', Object.keys(sessionsData[0]))
      }
    }
    
  } catch (err) {
    console.error('Error checking structure:', err)
  }
}

checkTableStructure()