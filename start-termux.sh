#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Start script untuk Termux
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

# Cek apakah database ada
if [ ! -f "db/custom.db" ]; then
  echo "[!] Database belum ada, membuat..."
  npx prisma db push
fi

echo "============================================"
echo "  Daily Life Manager"
echo "============================================"
echo ""
echo "Server mulai di http://localhost:3000"
echo "Tekan Ctrl+C untuk berhenti"
echo ""

# Wake lock supaya Termux tidak dibunuh Android saat screen off
# (Hanya berlaku di Termux Android)
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif (HP tidak akan sleep)"
fi

# Start dev server
# Bind ke 0.0.0.0 supaya bisa diakses dari browser HP dan device lain di WiFi
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

# Trap Ctrl+C untuk release wake lock
trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

if [ "$1" == "--local" ]; then
  # Hanya localhost
  npm run dev
else
  echo "[i] Akses dari device lain di WiFi: http://[IP-HP-Anda]:$PORT"
  echo "[i] Untuk localhost only: bash start-termux.sh --local"
  echo ""
  npx next dev -H "$HOST" -p "$PORT"
fi
