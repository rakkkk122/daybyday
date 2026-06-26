#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Stop Server
# ============================================================
# Hentikan server yang jalan di background.
# Pakai via Termux:Widget shortcut atau manual.
# ============================================================

PROJECT_DIR=""
for candidate in "$(dirname "$0")/.." "$HOME/daybyday" "$HOME/dailylife" "$HOME/dayapp"; do
  if [ -f "$candidate/package.json" ]; then
    PROJECT_DIR="$(cd "$candidate" 2>/dev/null && pwd)"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo "[!] Tidak bisa menemukan folder project"
  exit 1
fi

cd "$PROJECT_DIR"
PID_FILE="$PROJECT_DIR/server.pid"

# Kill server via PID file
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE" 2>/dev/null)
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null
    sleep 1
    kill -9 "$PID" 2>/dev/null
    echo "[i] Server (PID $PID) dihentikan"
  else
    echo "[i] PID $PID tidak aktif"
  fi
  rm -f "$PID_FILE"
else
  echo "[i] Tidak ada PID file, coba cari process lain..."
fi

# Kill process lain yang dengar port 3000
PORT="${PORT:-3000}"
pids=$(lsof -ti :$PORT 2>/dev/null || ss -tlnp 2>/dev/null | grep ":$PORT" | grep -oP 'pid=\K[0-9]+' || true)
if [ -n "$pids" ]; then
  echo "$pids" | xargs kill 2>/dev/null
  sleep 1
  echo "$pids" | xargs kill -9 2>/dev/null
  echo "[i] Process di port $PORT dihentikan"
fi

# Juga kill process next-server yang mungkin nyangkut
pkill -f "next dev" 2>/dev/null && echo "[i] next dev dihentikan" || true
pkill -f "next-server" 2>/dev/null && echo "[i] next-server dihentikan" || true

# Release wake lock
if command -v termux-wake-release &> /dev/null; then
  termux-wake-release 2>/dev/null
fi

echo ""
echo "[✓] Server berhenti. Baterai akan hemat lagi."
echo "    Untuk start lagi: tap icon DailyLife di home screen"
