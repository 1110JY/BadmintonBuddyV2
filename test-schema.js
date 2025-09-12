// Check the exact table schema
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    // Test creating with a manual ID like the existing data
    console.log('Testing with manual timestamp ID...')
    
    const manualId = Date.now().toString()
    const deviceId = 'test_device_' + Date.now()
    
    const { data, error } = await supabase
      .from('players')
      .insert({ 
        id: manualId,
        name: 'Test Player Manual ID', 
        device_id: deviceId 
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error with manual ID:', error)
    } else {
      console.log('✅ Success with manual ID:', data)
    }

    // Test without ID (let it auto-generate)
    console.log('\nTesting without ID...')
    const { data: data2, error: error2 } = await supabase
      .from('players')
      .insert({ 
        name: 'Test Player Auto ID', 
        device_id: deviceId 
      })
      .select()
      .single()
    
    if (error2) {
      console.error('❌ Error without ID:', error2)
    } else {
      console.log('✅ Success without ID:', data2)
    }
    
  } catch (err) {
    console.error('Test failed:', err)
  }
}

checkSchema()