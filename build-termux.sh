#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Production build untuk Termux
# ============================================================
# Build aplikasi untuk production (lebih cepat & ringan dari dev mode)
# Cara pakai: bash build-termux.sh
# Setelah build, jalankan dengan: bash start-prod.sh
# ============================================================
set -e

echo "============================================"
echo "  Daily Life Manager — Production Build"
echo "============================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "[!] Dependencies belum diinstall. Jalankan: bash install-termux.sh"
  exit 1
fi

echo "[1/3] Generate Prisma client..."
npx prisma generate

echo "[2/3] Build aplikasi (mungkin butuh 5-10 menit)..."
npm run build

echo "[3/3] Build selesai!"
echo ""
echo "============================================"
echo "  ✓ Production build siap!"
echo "============================================"
echo ""
echo "Cara menjalankan (mode production):"
echo "  bash start-prod.sh"
echo ""
echo "Keuntungan mode production:"
echo "  - Lebih cepat (no hot reload)"
echo "  - Lebih hemat RAM/baterai"
echo "  - Cocok untuk pemakaian harian"
