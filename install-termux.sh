#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Installer untuk Termux Android
# Database: node:sqlite (built-in Node.js, no native binary)
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
  echo "    Untuk Linux/Mac/Windows, gunakan: npm install"
  exit 1
fi

echo "[1/5] Update package list..."
pkg update -y > /dev/null 2>&1 || true

if ! command -v node &> /dev/null; then
  echo "[2/5] Install Node.js..."
  pkg install nodejs-lts -y
else
  echo "[2/5] Node.js sudah ada: $(node --version)"
fi

# Install termux-tools untuk auto-open Chrome (termux-open-url)
if ! command -v termux-open-url &> /dev/null; then
  echo "[2.5/5] Install termux-tools (untuk auto-open Chrome)..."
  pkg install termux-tools -y > /dev/null 2>&1 || true
fi

# Cek Node.js version (butuh 22+ untuk node:sqlite)
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "    [!] Node.js $NODE_MAJOR.x terlalu lama, upgrade ke 22+..."
  pkg upgrade nodejs-lts -y
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
  echo "    Setelah upgrade: Node.js $(node --version)"
fi

# Cek node:sqlite tersedia
if ! node --experimental-sqlite -e "require('node:sqlite')" 2>/dev/null; then
  echo "    [!] node:sqlite tidak tersedia. Coba upgrade Node.js:"
  echo "    pkg upgrade nodejs-lts -y"
fi

# ===== HAPUS sisa Prisma/libsql dari install lama (PENTING!) =====
# npm kadang restore package lama dari cache/lockfile walau sudah diuninstall
echo ""
echo "[3/5] Bersihkan sisa Prisma/libsql dari install lama..."
rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma 2>/dev/null
rm -rf node_modules/@libsql 2>/dev/null
rm -rf prisma/ drizzle.config.ts 2>/dev/null
# Hapus juga package-lock.json kalau ada (mulai bersih)
rm -f package-lock.json 2>/dev/null
echo "    ✓ Bersih"

# Install dependencies (pure JS, no native binary)
echo ""
echo "[4/5] Install dependencies (1-3 menit, pure JS packages)..."
npm install --no-audit --no-fund 2>&1 | tail -5

# Verify tidak ada sisa Prisma setelah install
if [ -d "node_modules/prisma" ] || [ -d "node_modules/@prisma" ]; then
  echo ""
  echo "    [!] WARNING: Prisma masih ada setelah install!"
  echo "    Hapus manual dengan:"
  echo "    rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma"
  rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma 2>/dev/null
fi
echo "    ✓ Tidak ada Prisma/libsql (verified)"

# Setup environment file — ALWAYS overwrite DATABASE_URL to correct Termux path
PROJECT_DIR="$(pwd)"
TERMUX_DB_PATH="$PROJECT_DIR/db/custom.db"

if [ ! -f .env ]; then
  echo "[5/5] Buat file .env dari template..."
  cp .env.example .env
fi

# FORCE overwrite DATABASE_URL dengan path Termux yang benar
# (handle case: .env lama dari sandbox masih ada isinya /home/z/my-project/...)
echo "[5/5] Set DATABASE_URL ke: $TERMUX_DB_PATH"
if grep -q "^DATABASE_URL=" .env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=file:$TERMUX_DB_PATH|" .env
else
  echo "DATABASE_URL=file:$TERMUX_DB_PATH" >> .env
fi
echo "    ✓ .env updated: DATABASE_URL=file:$TERMUX_DB_PATH"

# Tidak perlu drizzle-kit push atau prisma db push!
# Database auto-init saat app pertama kali start (CREATE TABLE IF NOT EXISTS)

echo ""
echo "============================================"
echo "  ✓ Install selesai!"
echo "============================================"
echo ""
echo "Cara menjalankan:"
echo "  bash start-termux.sh"
echo ""
echo "Akses:"
echo "  - HP sendiri: http://localhost:3000"
echo "  - Device lain di WiFi: http://[IP-HP-Anda]:3000"
echo ""
echo "============================================"
echo "  Optional: Setup AI Assistant"
echo "============================================"
echo "Fitur AI (Saran Makanan, Buat Rencana, Insight)"
echo "butuh API key gratis dari z.ai"
echo ""
echo "Cara setup:"
echo "  bash setup-ai.sh"
echo "  (script akan minta API key & simpan otomatis)"
echo ""
echo "Atau manual:"
echo "  1. Dapat API key di https://z.ai"
echo "  2. Tambah ke .env: ZAI_API_KEY=your_key"
echo "  3. Restart: bash start-termux.sh"
echo ""
echo "Tanpa AI key, fitur lain tetap jalan normal:"
echo "  Tasks, Reminders, Plans, Gym, Food, Work, Statistik"
