// Device identification utility for privacy
// Generates and stores a unique device ID in localStorage

export function getDeviceId(): string {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    // Server-side rendering - return a temporary ID
    return 'server_temp_id'
  }

  const DEVICE_ID_KEY = 'badminton_buddy_device_id';
  
  // Check if we already have a device ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a new unique device ID
    deviceId = generateUniqueId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

function generateUniqueId(): string {
  // Generate a random UUID-like string
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// For debugging - get device ID without creating one
export function getCurrentDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('badminton_buddy_device_id');
}

// For testing - clear device ID (use with caution)
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem('badminton_buddy_device_id');
}