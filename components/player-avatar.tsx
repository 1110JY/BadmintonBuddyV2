interface PlayerAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * Deterministic hash function to map player names to colors
 * Returns the same color for the same name across the app
 */
function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Color palette - 10 distinct colors inspired by Google Contacts
 */
const colorPalette = [
  { bg: "bg-blue-500", text: "text-blue-600" },        // teal/blue
  { bg: "bg-indigo-500", text: "text-indigo-600" },    // indigo
  { bg: "bg-purple-500", text: "text-purple-600" },    // violet
  { bg: "bg-pink-500", text: "text-pink-600" },        // rose
  { bg: "bg-red-500", text: "text-red-600" },          // red
  { bg: "bg-orange-500", text: "text-orange-600" },    // amber/orange
  { bg: "bg-amber-500", text: "text-amber-600" },      // amber
  { bg: "bg-emerald-500", text: "text-emerald-600" },  // emerald
  { bg: "bg-teal-500", text: "text-teal-600" },        // teal
  { bg: "bg-cyan-500", text: "text-cyan-600" },        // sky
]

/**
 * Get initials from player name
 * Handles single names, multi-word names, etc.
 */
function getInitials(name: string): string {
  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length >= 2) {
    // Multiple words: take first letter of first and last word
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Single name: take first two letters
  return trimmed.substring(0, 2).toUpperCase()
}

/**
 * Get color for a player based on their name
 * Deterministic - same name always gets same color
 */
function getColorForName(name: string): { bg: string; text: string } {
  const hash = hashName(name)
  const colorIndex = hash % colorPalette.length
  return colorPalette[colorIndex]
}

export function PlayerAvatar({ name, size = "md", className = "" }: PlayerAvatarProps) {
  const initials = getInitials(name)
  const color = getColorForName(name)

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${color.bg} rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${className}`}
      title={name}
    >
      {initials}
    </div>
  )
}
