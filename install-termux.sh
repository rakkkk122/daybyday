#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Installer untuk Termux Android
# ============================================================
# Cara pakai:
#   1. Buka Termux
#   2. cd ke folder project ini
#   3. bash install-termux.sh
# ============================================================
set -e

echo "============================================"
echo "  Daily Life Manager — Termux Installer"
echo "============================================"
echo ""

# Cek apakah jalan di Termux
if [ ! -d "/data/data/com.termux" ]; then
  echo "[!] Script ini untuk Termux Android."
  echo "    Untuk Linux/Mac/Windows, gunakan: npm install && npx prisma db push"
  exit 1
fi

# Update package list
echo "[1/6] Update package list..."
pkg update -y > /dev/null 2>&1 || true

# Install Node.js (LTS) kalau belum ada
if ! command -v node &> /dev/null; then
  echo "[2/6] Install Node.js..."
  pkg install nodejs-lts -y
else
  echo "[2/6] Node.js sudah ada: $(node --version)"
fi

# Install git kalau belum
if ! command -v git &> /dev/null; then
  echo "[3/6] Install git..."
  pkg install git -y
else
  echo "[3/6] Git sudah ada"
fi

# Install dependencies
echo "[4/6] Install dependencies (mungkin butuh beberapa menit)..."
npm install

# Setup environment file
if [ ! -f .env ]; then
  echo "[5/6] Buat file .env dari template..."
  cp .env.example .env
  # Set path absolut untuk Termux
  PROJECT_DIR="$(pwd)"
  sed -i "s|file:./db/custom.db|file:$PROJECT_DIR/db/custom.db|g" .env
  echo "    .env dibuat dengan DATABASE_URL=file:$PROJECT_DIR/db/custom.db"
else
  echo "[5/6] .env sudah ada, lewati"
fi

# Init database
echo "[6/6] Init database SQLite..."
npx prisma db push

echo ""
echo "============================================"
echo "  ✓ Install selesai!"
echo "============================================"
echo ""
echo "Cara menjalankan:"
echo "  bash start-termux.sh"
echo ""
echo "Atau manual:"
echo "  npm run dev"
echo ""
echo "Lalu buka browser ke: http://localhost:3000"
echo ""
echo "Tips: Untuk akses dari HP lain di WiFi yang sama:"
echo "  npm run dev -- -H 0.0.0.0"
echo "  Lalu buka http://[IP-HP-Anda]:3000"
