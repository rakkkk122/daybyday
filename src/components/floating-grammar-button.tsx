'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { GrammarModal } from '@/components/grammar-modal'

/**
 * Floating Action Button (FAB) yang bisa di-drag ke mana saja di layar.
 * Klik → buka Grammar Modal
 * Long-press & drag → pindah posisi FAB
 *
 * Hanya muncul di mobile (md:hidden) — di desktop pakai tombol di top bar.
 */
export function FloatingGrammarButton() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [showHint, setShowHint] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = React.useState(false)

  // Set initial position (kanan bawah, di atas bottom nav)
  React.useEffect(() => {
    if (!initialized && typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 56 - 16,
        y: window.innerHeight - 56 - 80,
      })
      setInitialized(true)
    }
  }, [initialized])

  // Tampilkan hint sekali
  React.useEffect(() => {
    const seen = localStorage.getItem('dailylife-fab-hint-seen')
    if (!seen) {
      const timer = setTimeout(() => setShowHint(true), 1500)
      const hideTimer = setTimeout(() => {
        setShowHint(false)
        localStorage.setItem('dailylife-fab-hint-seen', '1')
      }, 6000)
      return () => {
        clearTimeout(timer)
        clearTimeout(hideTimer)
      }
    }
  }, [])

  // Handle pointer events untuk drag vs click detection
  const dragStateRef = React.useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    moved: false,
  })

  const handlePointerDown = (e: React.PointerEvent) => {
    const state = dragStateRef.current
    state.isDragging = true
    state.startX = e.clientX
    state.startY = e.clientY
    state.startPosX = position.x
    state.startPosY = position.y
    state.moved = false
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragStateRef.current
    if (!state.isDragging) return

    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY

    // Kalau move > 5px, anggap drag
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      state.moved = true
      const newX = state.startPosX + dx
      const newY = state.startPosY + dy
      // Clamp ke viewport
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - 56))
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - 56))
      setPosition({ x: clampedX, y: clampedY })
    }
  }

  const handlePointerUp = () => {
    const state = dragStateRef.current
    if (!state.isDragging) return

    state.isDragging = false
    // Kalau tidak move (cuma klik), buka modal
    if (!state.moved) {
      setModalOpen(true)
    }
  }

  if (!initialized) return null

  return (
    <>
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="fixed z-50 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center touch-none select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: 'grab',
        }}
        aria-label="Perbaiki grammar"
      >
        <Sparkles className="h-6 w-6 pointer-events-none" />

        {/* Hint tooltip */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-md whitespace-nowrap border border-border pointer-events-none"
            >
              <b>Perbaiki Grammar</b>
              <br />
              <span className="text-muted-foreground">Tap untuk pakai, drag untuk pindah</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Close hint button (terpisah supaya tidak trigger drag) */}
      {showHint && (
        <button
          onClick={() => {
            setShowHint(false)
            localStorage.setItem('dailylife-fab-hint-seen', '1')
          }}
          className="fixed z-50 md:hidden h-6 w-6 rounded-full bg-muted-foreground text-background flex items-center justify-center shadow-md"
          style={{
            left: `${position.x - 8}px`,
            top: `${position.y - 8}px`,
          }}
          aria-label="Tutup hint"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <GrammarModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
