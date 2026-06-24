'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/ui-store'
import { Sidebar, BottomNav } from '@/components/nav-shell'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardView } from '@/components/views/dashboard'
import { TasksView } from '@/components/views/tasks'
import { RemindersView } from '@/components/views/reminders'
import { PlansView } from '@/components/views/plans'
import { GymView } from '@/components/views/gym'
import { FoodView } from '@/components/views/food'
import { WorkView } from '@/components/views/work'

export default function Home() {
  const { activeView } = useUIStore()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Sidebar />

      {/* Top bar (mobile + desktop) */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 md:py-3 md:pl-64 bg-background/85 backdrop-blur-lg border-b border-border/50"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <div className="md:hidden flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">
            Daily<span className="text-primary">Life</span>
          </span>
        </div>
        <div className="hidden md:block text-sm text-muted-foreground">
          Personal Manager — Self-hosted
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 md:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'tasks' && <TasksView />}
            {activeView === 'reminders' && <RemindersView />}
            {activeView === 'plans' && <PlansView />}
            {activeView === 'gym' && <GymView />}
            {activeView === 'food' && <FoodView />}
            {activeView === 'work' && <WorkView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  )
}
// trigger compile
// trigger 2
