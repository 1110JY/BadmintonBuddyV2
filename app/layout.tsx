import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Badminton Buddy",
  description: "Manage your badminton sessions and players",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Favicon.png" />
      </head>
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  )
}
