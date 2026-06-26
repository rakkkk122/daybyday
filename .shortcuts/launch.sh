#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — One-Tap Launcher
# ============================================================
# Script ini untuk dijalankan via Termux:Widget shortcut.
# Cara kerja:
#   1. Cek apakah server sudah jalan (hindari duplikat)
#   2. Kalau belum, start server di background (detached)
#   3. Tunggu server ready
#   4. Buka Chrome ke http://localhost:3000
#   5. Tutup Termux (biarkan server jalan di background)
# ============================================================

# Cari folder project (coba beberapa lokasi)
PROJECT_DIR=""
for candidate in "$(dirname "$0")/.." "$HOME/daybyday" "$HOME/dailylife" "$HOME/dayapp"; do
  if [ -f "$candidate/package.json" ] && [ -f "$candidate/install-termux.sh" ]; then
    PROJECT_DIR="$(cd "$candidate" 2>/dev/null && pwd)"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo "[!] Tidak bisa menemukan folder project"
  echo "    Edit script ini, set PROJECT_DIR manual"
  echo "    Atau pindahkan project ke ~/daybyday"
  exit 1
fi

cd "$PROJECT_DIR"

PORT="${PORT:-3000}"
URL="http://localhost:$PORT"
LOG_FILE="$PROJECT_DIR/server.log"
PID_FILE="$PROJECT_DIR/server.pid"

# ===== 1. CEK APAKAH SERVER SUDAH JALAN =====
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    # Server masih jalan, langsung buka Chrome
    termux-open-url "$URL" 2>/dev/null || am start -a android.intent.action.VIEW -d "$URL" 2>/dev/null
    am force-stop com.termux 2>/dev/null || true
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# Alternatif: cek via port
PORT_IN_USE=false
if command -v ss &> /dev/null && ss -tln 2>/dev/null | grep -q ":$PORT"; then
  PORT_IN_USE=true
elif command -v netstat &> /dev/null && netstat -tln 2>/dev/null | grep -q ":$PORT"; then
  PORT_IN_USE=true
fi

if [ "$PORT_IN_USE" = true ]; then
  termux-open-url "$URL" 2>/dev/null || am start -a android.intent.action.VIEW -d "$URL" 2>/dev/null
  am force-stop com.termux 2>/dev/null || true
  exit 0
fi

# ===== 2. CEK DEPENDENCIES =====
if [ ! -d "node_modules" ]; then
  echo "[!] Dependencies belum diinstall"
  echo "    Buka Termux, jalankan: bash install-termux.sh"
  sleep 3
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "[!] File .env belum ada"
  echo "    Buka Termux, jalankan: bash install-termux.sh"
  sleep 3
  exit 1
fi

# ===== 3. SET ENV VARS =====
export NODE_OPTIONS="--experimental-sqlite ${NODE_OPTIONS:-}"
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# Fix .env kalau masih path sandbox
if grep -q "/home/z/my-project" .env 2>/dev/null; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=file:$PROJECT_DIR/db/custom.db|" .env
fi

# Hapus sisa Prisma kalau ada
rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma 2>/dev/null

# ===== 4. WAKE LOCK =====
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null
fi

# ===== 5. START SERVER DI BACKGROUND (DETACHED) =====
# Pakai nohup + disown supaya server tetap jalan walau Termux di-close
nohup npx next dev --webpack -H 0.0.0.0 -p "$PORT" > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"
disown $SERVER_PID 2>/dev/null

# ===== 6. TUNGGU SERVER READY (max 60 detik) =====
READY=false
for i in $(seq 1 60); do
  sleep 1
  if curl -s -o /dev/null --max-time 1 "$URL" 2>/dev/null; then
    sleep 2
    if curl -s -o /dev/null --max-time 5 "$URL" 2>/dev/null; then
      READY=true
      break
    fi
  fi
done

# ===== 7. BUKA CHROME =====
termux-open-url "$URL" 2>/dev/null || am start -a android.intent.action.VIEW -d "$URL" 2>/dev/null

# ===== 8. TUTUP TERMUX =====
am force-stop com.termux 2>/dev/null || true

exit 0
