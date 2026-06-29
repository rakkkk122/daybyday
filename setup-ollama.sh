#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Setup Ollama untuk Daily Life Manager (Offline AI)
# ============================================================
# Script ini setup Ollama di Termux untuk fitur:
#   - Perbaiki Grammar Inggris/Indonesia
#   - Translate Inggris ↔ Indonesia
#   - (Fallback untuk AI Assistant kalau ZAI tidak ada)
#
# Model: deepseek-r1:1.5b (~1GB, cocok untuk HP 4GB+ RAM)
#
# Cara pakai: bash setup-ollama.sh
# ============================================================
set -e

echo "============================================"
echo "  Setup Ollama — AI Offline untuk DailyLife"
echo "============================================"
echo ""

# ===== 1. CEK OS =====
if [ ! -d "/data/data/com.termux" ]; then
  echo "[!] Script ini untuk Termux Android."
  echo "    Untuk PC, install Ollama dari https://ollama.com"
  exit 1
fi

# ===== 2. CEK RAM (recommend 4GB+) =====
echo "[1/5] Cek RAM..."
MEMINFO=$(cat /proc/meminfo 2>/dev/null | grep MemTotal | awk '{print $2}')
if [ -n "$MEMINFO" ]; then
  RAM_MB=$((MEMINFO / 1024))
  echo "    RAM total: ${RAM_MB} MB"
  if [ "$RAM_MB" -lt 3500 ]; then
    echo "    [!] WARNING: RAM < 3.5GB. Model 1.5B mungkin lambat."
    echo "    Alternatif: pakai Ollama di PC, set OLLAMA_URL di .env"
    echo ""
    read -p "    Lanjut install? (y/N): " confirm
    [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && exit 0
  else
    echo "    ✓ RAM cukup untuk model 1.5B"
  fi
fi

# ===== 3. INSTALL OLLAMA =====
echo ""
echo "[2/5] Install Ollama..."
if command -v ollama &> /dev/null; then
  echo "    ✓ Ollama sudah terinstall: $(ollama --version 2>/dev/null | head -1)"
else
  pkg install ollama -y 2>&1 | tail -3
  if ! command -v ollama &> /dev/null; then
    echo "    [!] Gagal install Ollama via pkg"
    echo "    Coba manual dari: https://github.com/ollama/ollama/releases"
    exit 1
  fi
  echo "    ✓ Ollama terinstall"
fi

# ===== 4. START OLLAMA SERVER =====
echo ""
echo "[3/5] Start Ollama server..."
if curl -s -o /dev/null --max-time 2 http://localhost:11434/api/tags 2>/dev/null; then
  echo "    ✓ Ollama server sudah jalan"
else
  echo "    [i] Start Ollama server di background..."
  # Pakai setsid supaya tetap jalan walau Termux close
  setsid nohup ollama serve > "$HOME/ollama.log" 2>&1 < /dev/null &
  disown 2>/dev/null || true

  # Tunggu server ready
  echo "    [i] Tunggu server ready..."
  for i in $(seq 1 30); do
    sleep 1
    if curl -s -o /dev/null --max-time 2 http://localhost:11434/api/tags 2>/dev/null; then
      echo "    ✓ Ollama server ready (detik $i)"
      break
    fi
    [ $i -eq 30 ] && {
      echo "    [!] Ollama server gagal start setelah 30 detik"
      echo "    Cek log: cat $HOME/ollama.log"
      exit 1
    }
  done
fi

# ===== 5. DOWNLOAD MODEL =====
echo ""
echo "[4/5] Download model deepseek-r1:1.5b (~1GB)..."
echo "    Ini mungkin butuh 5-15 menit tergantung koneksi."
echo ""

# Cek apakah model sudah ada
EXISTING=$(curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    models = [m['name'] for m in d.get('models', [])]
    print(','.join(models))
except:
    print('')
" 2>/dev/null)

if echo "$EXISTING" | grep -q "deepseek-r1:1.5b"; then
  echo "    ✓ Model deepseek-r1:1.5b sudah ada"
else
  ollama pull deepseek-r1:1.5b
  echo "    ✓ Model terdownload"
fi

# ===== 6. UPDATE .env =====
echo ""
echo "[5/5] Update .env dengan Ollama config..."
PROJECT_DIR=""
for candidate in "$(dirname "$0")" "$HOME/daybyday" "$HOME/dailylife" "$HOME/dayapp"; do
  if [ -f "$candidate/.env" ] || [ -f "$candidate/install-termux.sh" ]; then
    PROJECT_DIR="$(cd "$candidate" 2>/dev/null && pwd)"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  echo "    [!] Tidak bisa menemukan folder project untuk update .env"
  echo "    Manual: tambahkan ke .env:"
  echo "      OLLAMA_URL=http://localhost:11434"
  echo "      OLLAMA_MODEL=deepseek-r1:1.5b"
else
  cd "$PROJECT_DIR"
  if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=file:$(pwd)/db/custom.db" > .env
  fi

  # Tambah/update OLLAMA_URL
  if grep -q "^OLLAMA_URL=" .env; then
    sed -i "s|^OLLAMA_URL=.*|OLLAMA_URL=http://localhost:11434|" .env
  else
    echo "OLLAMA_URL=http://localhost:11434" >> .env
  fi

  # Tambah/update OLLAMA_MODEL
  if grep -q "^OLLAMA_MODEL=" .env; then
    sed -i "s|^OLLAMA_MODEL=.*|OLLAMA_MODEL=deepseek-r1:1.5b|" .env
  else
    echo "OLLAMA_MODEL=deepseek-r1:1.5b" >> .env
  fi

  echo "    ✓ .env updated: OLLAMA_URL + OLLAMA_MODEL"
fi

# ===== TEST MODEL =====
echo ""
echo "============================================"
echo "  Test model (cepat, sekitar 10-30 detik)..."
echo "============================================"
echo ""
echo "Pertanyaan: 'Apa 2+2?'"
echo "Jawaban:"
ollama run deepseek-r1:1.5b "Apa 2+2? Jawab dengan angka saja." 2>&1 | head -5

echo ""
echo "============================================"
echo "  ✓ Setup Ollama selesai!"
echo "============================================"
echo ""
echo "Sekarang fitur 'Perbaiki Grammar' akan pakai Ollama (offline)."
echo ""
echo "Cara pakai:"
echo "  1. Buka app (tap icon DailyLife)"
echo "  2. Tap tombol sparkle (✨) di pojok kanan atas"
echo "     atau tap FAB mengambang di mobile"
echo "  3. Pilih mode: Perbaiki Grammar / Terjemah"
echo "  4. Paste teks, tap tombol"
echo ""
echo "Tips:"
echo "  - Ollama jalan di background, butuh ~500MB RAM saat aktif"
echo "  - Untuk stop Ollama: pkill ollama"
echo "  - Untuk start lagi: ollama serve &"
echo "  - Kalau HP lemot, pakai Ollama di PC:"
echo "    Set OLLAMA_URL=http://IP-PC:11434 di .env"
echo ""
echo "Model lain yang bisa dipakai (ganti OLLAMA_MODEL di .env):"
echo "  - llama3.2:1b (Meta, kecil, cepat)"
echo "  - qwen2.5:1.5b (Alibaba, bagus untuk grammar)"
echo "  - gemma2:2b (Google, balanced)"
