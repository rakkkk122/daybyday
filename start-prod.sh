#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Run production server
# ============================================================
# Cara pakai: bash start-prod.sh
# Harus sudah di-build: npm run build
# ============================================================

cd "$(dirname "$0")"

if [ ! -d ".next/standalone" ]; then
  echo "[!] Build belum ada."
  echo "    Jalankan dulu: npm run build"
  exit 1
fi

# Set env vars untuk Termux compatibility
export NODE_OPTIONS="--experimental-sqlite ${NODE_OPTIONS:-}"
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# Wake lock
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif"
fi

trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
URL="http://localhost:$PORT"

echo "============================================"
echo "  Daily Life Manager (Production)"
echo "============================================"
echo ""
echo "Server mulai di $URL"
echo "Akses dari device lain: http://[IP-HP-Anda]:$PORT"
echo ""

# ===== AUTO-OPEN BROWSER =====
if command -v termux-open-url &> /dev/null; then
  (
    for i in $(seq 1 30); do
      sleep 1
      if curl -s -o /dev/null --max-time 1 "$URL" 2>/dev/null; then
        sleep 1
        echo "[i] Server ready! Membuka Chrome..."
        termux-open-url "$URL" 2>/dev/null || true
        break
      fi
    done
  ) &
  BROWSER_WAIT_PID=$!
fi

NODE_ENV=production node .next/standalone/server.js

# Kalau server berhenti, kill browser wait juga
if [ -n "$BROWSER_WAIT_PID" ]; then
  kill $BROWSER_WAIT_PID 2>/dev/null || true
fi
