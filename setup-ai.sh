#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Setup AI API Key untuk Daily Life Manager
# ============================================================
# Cara pakai:
#   bash setup-ai.sh
#
# Script ini akan:
# 1. Minta Anda input API key dari https://z.ai
# 2. Simpan ke file .env (var ZAI_API_KEY)
# 3. Juga buat file .z-ai-config (untuk compat SDK)
# ============================================================
set -e

cd "$(dirname "$0")"

echo "============================================"
echo "  Setup AI API Key — Daily Life Manager"
echo "============================================"
echo ""
echo "Cara dapat API key gratis:"
echo "  1. Buka https://z.ai di browser"
echo "  2. Sign Up (bisa pakai email/Google/GitHub)"
echo "  3. Login → Dashboard → API Keys"
echo "  4. Click 'Create API Key'"
echo "  5. Copy API key yang muncul"
echo ""
echo "Format API key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
echo ""

# Minta user input API key
read -p "Paste API key Anda di sini: " API_KEY

if [ -z "$API_KEY" ]; then
  echo "[!] API key tidak boleh kosong"
  exit 1
fi

# Validate format (cuma cek panjang minimal)
if [ ${#API_KEY} -lt 20 ]; then
  echo "[!] API key terlalu pendek, sepertinya tidak valid"
  exit 1
fi

echo ""
echo "[i] Menyimpan API key..."

# 1. Tambah/update ZAI_API_KEY di .env
if [ -f .env ]; then
  if grep -q "^ZAI_API_KEY=" .env; then
    # Update existing
    sed -i "s|^ZAI_API_KEY=.*|ZAI_API_KEY=$API_KEY|" .env
    echo "    ✓ .env: ZAI_API_KEY updated"
  else
    # Append
    echo "ZAI_API_KEY=$API_KEY" >> .env
    echo "    ✓ .env: ZAI_API_KEY added"
  fi
else
  echo "DATABASE_URL=file:$(pwd)/db/custom.db" > .env
  echo "ZAI_API_KEY=$API_KEY" >> .env
  echo "    ✓ .env created with ZAI_API_KEY"
fi

# 2. Juga buat file .z-ai-config (compat untuk ZAI SDK)
cat > .z-ai-config <<EOF
{
  "baseUrl": "https://api.z.ai/api/v1",
  "apiKey": "$API_KEY"
}
EOF
echo "    ✓ .z-ai-config created"

echo ""
echo "============================================"
echo "  ✓ Setup selesai!"
echo "============================================"
echo ""
echo "Sekarang jalankan app:"
echo "  bash start-termux.sh"
echo ""
echo "Fitur AI yang aktif:"
echo "  - AI Assistant → Saran Makanan"
echo "  - AI Assistant → Buat Rencana"
echo "  - AI Assistant → Insight (analisis pola)"
echo ""
echo "Untuk ganti/hapus API key:"
echo "  Edit file .env, hapus baris ZAI_API_KEY"
echo "  Hapus file .z-ai-config"
