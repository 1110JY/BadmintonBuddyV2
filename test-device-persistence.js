// Test device ID persistence
console.log('Testing localStorage device ID...')

// Check if we're in browser environment
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  console.log('✅ Browser environment detected')
  
  // Check current device ID
  const currentDeviceId = localStorage.getItem('badminton_buddy_device_id')
  console.log('Current device ID:', currentDeviceId)
  
  // If no device ID, create one
  if (!currentDeviceId) {
    const newDeviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
    localStorage.setItem('badminton_buddy_device_id', newDeviceId)
    console.log('✅ Created new device ID:', newDeviceId)
  } else {
    console.log('✅ Using existing device ID:', currentDeviceId)
  }
  
  // Test persistence
  const retrievedId = localStorage.getItem('badminton_buddy_device_id')
  console.log('Retrieved device ID:', retrievedId)
  
} else {
  console.log('❌ Not in browser environment')
}