import React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Outfit } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta"
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit"
})

export const metadata: Metadata = {
  title: "Badminton Buddy",
  description: "Manage your badminton sessions and players",
  generator: "v0.dev",
  applicationName: "Badminton Buddy",
  keywords: ["badminton", "sports", "session management", "player tracking", "games"],
  authors: [{ name: "Josh.Y" }],
  creator: "Josh.Y",
  publisher: "Josh.Y",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/Favicon.png', type: 'image/png' },
      { url: '/Favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/Favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Favicon.png',
    apple: [
      { url: '/Favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Favicon.png" type="image/png" />
      </head>
      <body className={`${plusJakartaSans.className} ${outfit.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <Navigation />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-black dark:via-gray-900 dark:to-slate-900">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
