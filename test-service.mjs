// Test our actual service function
import { playerService } from './lib/supabase.js'

async function testServiceFunction() {
  try {
    console.log('Testing playerService.create...')
    
    const result = await playerService.create('Test Service Player')
    console.log('✅ Success:', result)
    
  } catch (err) {
    console.error('❌ Error:', err)
    console.error('Error details:', JSON.stringify(err, null, 2))
  }
}

testServiceFunction()