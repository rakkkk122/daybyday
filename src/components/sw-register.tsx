'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Only register in production-like contexts; skip during dev to avoid caching issues
    // Actually we DO want it in dev too for testing PWA — register it.
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Check for updates periodically
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing
            if (!nw) return
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — silently activate
                nw.postMessage('SKIP_WAITING')
              }
            })
          })
        })
        .catch((err) => {
          // Silently ignore — SW is a progressive enhancement
          console.warn('[SW] registration failed:', err)
        })
    }
    // Register after window load to not block first paint
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
