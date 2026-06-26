#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Setup One-Tap Launcher untuk Daily Life Manager
# ============================================================
# Script ini setup shortcut di home screen Android
# supaya user tinggal tap icon → app jalan + Chrome buka.
#
# Prasyarat:
#   - Termux terinstall
#   - Termux:Widget terinstall (dari F-Droid)
#   - Project sudah di-install (bash install-termux.sh)
#
# Cara pakai: bash setup-launcher.sh
# ============================================================
set -e

echo "============================================"
echo "  Setup One-Tap Launcher"
echo "  Daily Life Manager"
echo "============================================"
echo ""

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

# ===== 1. CEK TERMUX:WIDGET =====
echo "[1/4] Cek Termux:Widget..."
if [ ! -d "/data/data/com.termux.widget" ] && ! command -v termux-widget &> /dev/null; then
  echo "    [!] Termux:Widget belum terinstall"
  echo ""
  echo "    Cara install:"
  echo "    1. Download dari F-Droid:"
  echo "       https://f-droid.org/packages/com.termux.widget/"
  echo "    2. Atau scan QR / cari 'Termux:Widget' di F-Droid app"
  echo "    3. Install, lalu jalankan script ini lagi"
  echo ""
  echo "    Catatan: JANGAN install dari Play Store (versi lama/deprecated)"
  exit 1
fi
echo "    ✓ Termux:Widget terdeteksi"

# ===== 2. BUAT FOLDER .shortcuts DI HOME TERMUX =====
# Termux:Widget baca shortcut dari ~/.shortcuts/
echo ""
echo "[2/4] Setup folder .shortcuts..."
SHORTCUTS_DIR="$HOME/.shortcuts"
mkdir -p "$SHORTCUTS_DIR"

# Copy launch.sh dan stop.sh ke ~/.shortcuts/
cp "$PROJECT_DIR/.shortcuts/launch.sh" "$SHORTCUTS_DIR/DailyLife - Start.sh"
cp "$PROJECT_DIR/.shortcuts/stop.sh" "$SHORTCUTS_DIR/DailyLife - Stop.sh"
chmod +x "$SHORTCUTS_DIR/DailyLife - Start.sh"
chmod +x "$SHORTCUTS_DIR/DailyLife - Stop.sh"
echo "    ✓ Shortcuts dibuat di ~/.shortcuts/"

# ===== 3. UPDATE PATH PROJECT DI SCRIPT =====
# Edit launch.sh supaya langsung pakai project path ini (lebih cepat)
echo ""
echo "[3/4] Update path project di script..."
sed -i "s|^PROJECT_DIR=\"\"$|PROJECT_DIR=\"$PROJECT_DIR\"|" "$SHORTCUTS_DIR/DailyLife - Start.sh" 2>/dev/null || true
sed -i "s|^PROJECT_DIR=\"\"$|PROJECT_DIR=\"$PROJECT_DIR\"|" "$SHORTCUTS_DIR/DailyLife - Stop.sh" 2>/dev/null || true
echo "    ✓ Path project: $PROJECT_DIR"

# ===== 4. INSTRUKSI TAMBAH SHORTCUT KE HOME SCREEN =====
echo ""
echo "[4/4] Tambah shortcut ke Home Screen..."
echo ""
echo "    Cara manual (lakukan di HP Anda):"
echo "    1. Long-press di area kosong di Home Screen"
echo "    2. Pilih 'Widget' (atau 'Add widget')"
echo "    3. Cari 'Termux:Widget' di list"
echo "    4. Pilih widget 'Termux Shortcut' (ukuran 1x1)"
echo "    5. Drag ke Home Screen"
echo "    6. Pilih salah satu shortcut:"
echo "       - 'DailyLife - Start' → untuk start app + buka Chrome"
echo "       - 'DailyLife - Stop'  → untuk stop server (hemat baterai)"
echo ""
echo "    Atau cara cepat:"
echo "    1. Buka app Termux:Widget"
echo "    2. Pilih 'DailyLife - Start'"
echo "    3. Tap 'Create shortcut'"
echo ""

echo "============================================"
echo "  ✓ Setup selesai!"
echo "============================================"
echo ""
echo "Cara pakai:"
echo "  • Tap icon 'DailyLife - Start' di Home Screen"
echo "    → Server jalan + Chrome buka + Termux close sendiri"
echo "  • Tap icon 'DailyLife - Stop' untuk stop server"
echo "    → Hemat baterai saat tidak dipakai"
echo ""
echo "Tips:"
echo "  - Server jalan di background, aman walau Termux di-close"
echo "  - Pakai wake-lock otomatis (HP tidak akan sleep)"
echo "  - Untuk akses dari device lain: http://[IP-HP-Anda]:3000"
echo "  - Cek IP: ifconfig di Termux"
