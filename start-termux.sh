#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Start script untuk Termux Android
# Database: node:sqlite (built-in Node.js, no native binary)
# ============================================================
# Cara pakai: bash start-termux.sh
# ============================================================

# Cek apakah node_modules ada
if [ ! -d "node_modules" ]; then
  echo "[!] Dependencies belum diinstall."
  echo "    Jalankan dulu: bash install-termux.sh"
  exit 1
fi

# Cek apakah .env ada
if [ ! -f ".env" ]; then
  echo "[!] File .env belum ada."
  echo "    Jalankan dulu: bash install-termux.sh"
  exit 1
fi

cd "$(dirname "$0")"

# ===== SAFETY: Fix .env jika DATABASE_URL masih path sandbox =====
PROJECT_DIR="$(pwd)"
TERMUX_DB_PATH="$PROJECT_DIR/db/custom.db"

if [ -f .env ]; then
  CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env 2>/dev/null | head -1 | cut -d= -f2-)
  if echo "$CURRENT_DB_URL" | grep -q "/home/z/my-project"; then
    echo "[i] Fix .env: DATABASE_URL masih path sandbox, ganti ke Termux path..."
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=file:$TERMUX_DB_PATH|" .env
    echo "    ✓ .env updated: DATABASE_URL=file:$TERMUX_DB_PATH"
  fi
fi

# ===== SAFETY: Hapus sisa Prisma kalau ada =====
if [ -d "node_modules/prisma" ] || [ -d "node_modules/@prisma" ] || [ -d "node_modules/.prisma" ]; then
  echo "[i] Hapus sisa Prisma dari node_modules..."
  rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma 2>/dev/null
  echo "    ✓ Bersih"
fi

# ===== DIAGNOSA AWAL =====
echo ""
echo "===== DIAGNOSA ====="
echo "Node.js : $(node --version 2>/dev/null || echo 'tidak ditemukan')"
ARCH=$(uname -m 2>/dev/null || echo "?")
echo "Arch    : $ARCH"
NEXT_VER=$(node -p "require('./node_modules/next/package.json').version" 2>/dev/null || echo "?")
echo "Next.js : $NEXT_VER"
echo "Database: node:sqlite (built-in, no native binary!)"
echo "===================="
echo ""

# Cek Node.js version (Butuh 22+ untuk node:sqlite)
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "[!] Node.js version terlalu lama!"
  echo "    App butuh Node.js 22+ untuk fitur node:sqlite."
  echo "    Upgrade dengan: pkg install nodejs-lts"
  exit 1
fi

# Cek node:sqlite tersedia
if ! node --experimental-sqlite -e "require('node:sqlite')" 2>/dev/null; then
  echo "[!] node:sqlite tidak tersedia di Node.js Anda."
  echo "    Upgrade Node.js: pkg install nodejs-lts"
  exit 1
fi

# ===== CLEAN .next CACHE (fix chunk JS error) =====
echo "[i] Bersihkan .next cache..."
rm -rf .next/cache 2>/dev/null || true

# ===== SET ENV VARS =====
# Penting: --experimental-sqlite untuk enable node:sqlite module
export NODE_OPTIONS="--experimental-sqlite ${NODE_OPTIONS:-}"

# Fix Watchpack EACCES (Termux tidak bisa watch folder sistem Android)
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# ===== WAKE LOCK =====
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif"
fi

trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

echo ""
echo "============================================"
echo "  Daily Life Manager"
echo "============================================"
echo ""
echo "[i] Mode: dev (webpack, node:sqlite)"
echo "[i] DB akan auto-init (CREATE TABLE IF NOT EXISTS)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

if [ "$1" == "--local" ]; then
  HOST="127.0.0.1"
  echo "[i] Bind ke localhost only"
else
  echo "[i] Akses dari device lain: http://[IP-HP-Anda]:$PORT"
fi

URL="http://localhost:$PORT"
echo ""
echo "============================================"
echo "  Server mulai di $URL"
echo "============================================"
echo ""

# ===== AUTO-OPEN BROWSER (background, tunggu server ready) =====
OPEN_BROWSER=true
if ! command -v termux-open-url &> /dev/null; then
  OPEN_BROWSER=false
  echo "[i] termux-open-url tidak ada — browser tidak auto-open"
  echo "    Install dengan: pkg install termux-tools"
fi

if [ "$OPEN_BROWSER" = true ]; then
  (
    for i in $(seq 1 60); do
      sleep 1
      if curl -s -o /dev/null --max-time 1 "$URL" 2>/dev/null; then
        sleep 2
        if curl -s -o /dev/null --max-time 5 "$URL" 2>/dev/null; then
          echo ""
          echo "[i] Server ready! Membuka Chrome..."
          termux-open-url "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true
          break
        fi
      fi
    done
  ) &
  BROWSER_WAIT_PID=$!
fi

# Start dev server dengan webpack
npx next dev --webpack -H "$HOST" -p "$PORT"

# Kalau server berhenti, kill browser wait juga
if [ -n "$BROWSER_WAIT_PID" ]; then
  kill $BROWSER_WAIT_PID 2>/dev/null || true
fi
