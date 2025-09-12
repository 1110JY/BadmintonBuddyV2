"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Home, Users, Calendar, BarChart3, Menu, X, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Players", href: "/players", icon: Users },
  { name: "Sessions", href: "/sessions", icon: Calendar },
  { name: "Statistics", href: "/stats", icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="border-b bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 dark:bg-black/95 dark:border-gray-800"
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center space-x-3 group">
                <motion.div 
                  className="w-10 h-10 bg-blue-500 rounded-xl rotate-12 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border-t border-blue-300/50"
                  whileHover={{ rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Trophy className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-blue-600 leading-none font-display tracking-tight">
                    BADMINTON
                    <span className="block text-sm font-semibold text-slate-600 -mt-1 dark:text-slate-300">BUDDY</span>
                  </h1>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex space-x-2">
                {navigation.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                    >
                      <Link href={item.href}>
                        <motion.div
                          className={cn(
                            "relative flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300",
                            isActive
                              ? "text-white"
                              : "text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-blue-500 rounded-xl shadow-lg border-t border-blue-300/50 dark:shadow-white/20"
                              initial={false}
                              transition={{ type: "spring", duration: 0.6 }}
                            />
                          )}
                          <Icon className="h-4 w-4 relative z-10" />
                          <span className="relative z-10">{item.name}</span>
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative z-50"
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed top-16 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xl border-t dark:bg-black/95 dark:border-gray-800"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="space-y-2">
                  {navigation.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <motion.div
                            className={cn(
                              "flex items-center space-x-3 text-base font-semibold px-4 py-4 rounded-xl transition-all duration-300",
                              isActive
                                ? "bg-blue-500 text-white shadow-lg border-t border-blue-300/50 dark:shadow-white/20"
                                : "text-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                            )}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </motion.div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
