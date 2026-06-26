'use client'

import * as React from 'react'
import { LayoutDashboard, CheckSquare, Bell, Target, Dumbbell, UtensilsCrossed, Briefcase, Sparkles, BarChart3 } from 'lucide-react'
import { useUIStore, type ViewKey } from '@/store/ui-store'
import { cn } from '@/lib/utils'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { key: 'tasks', label: 'Tugas', icon: CheckSquare },
  { key: 'reminders', label: 'Reminder', icon: Bell },
  { key: 'plans', label: 'Rencana', icon: Target },
  { key: 'gym', label: 'Gym', icon: Dumbbell },
  { key: 'food', label: 'Makanan', icon: UtensilsCrossed },
  { key: 'work', label: 'Kerja', icon: Briefcase },
  { key: 'ai', label: 'AI', icon: Sparkles },
  { key: 'stats', label: 'Statistik', icon: BarChart3 },
]

export function BottomNav() {
  const { activeView, setActiveView } = useUIStore()
  // Hydration guard: Zustand persist baca localStorage di client,
  // jadi activeView bisa beda antara server render dan client.
  // Tunggu mount dulu sebandingkan activeView supaya tidak hydration mismatch.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigasi utama"
    >
      <div className="grid grid-cols-9 gap-0 px-0.5 py-1">
        {NAV.map((item) => {
          const active = mounted && activeView === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-md py-1 text-[9px] font-medium transition-all active:scale-95 min-h-[40px] whitespace-nowrap',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className={cn('h-4 w-4', active && 'scale-110')} />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Sidebar() {
  const { activeView, setActiveView } = useUIStore()
  // Hydration guard: sama seperti BottomNav
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 border-r border-border bg-sidebar">
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Daily<span className="text-primary">Life</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Personal Manager</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navigasi samping">
        {NAV.map((item) => {
          const active = mounted && activeView === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-sidebar-border text-xs text-muted-foreground">
        <p>v1.0 • Self-hosted</p>
        <p className="mt-0.5">Data tersimpan lokal di perangkat</p>
      </div>
    </aside>
  )
}
