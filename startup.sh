#!/bin/bash
set -e

echo "=================================="
echo "Neurostack Copilot — Gemma Mode"
echo "=================================="

cd /app

# NO OLLAMA AT ALL — we use google/gemma-2-2b-it via HF Inference
echo "Skipping Ollama (using Gemma via HF Inference API)"

echo "Cleaning old code..."
rm -rf backend temp

echo "Cloning latest backend..."
git clone https://github.com/Saadajee/neurostack-copilot.git temp

echo "Installing fresh backend..."
cp -r temp/backend .

export PYTHONPATH="/app/backend:$PYTHONPATH"

# Indexes (persistent)
mkdir -p backend/app/data
if [ ! -f backend/app/data/index.faiss ] || [ ! -f backend/app/data/bm25_index.pkl ]; then
    echo "Building FAISS + BM25 indexes..."
    python backend/app/rag/build_index.py
    echo "Indexes ready!"
else
    echo "Existing indexes found — skipping build"
fi

echo "=================================="
echo "Launching FastAPI Server"
echo "Model → google/gemma-2-2b-it (HF Inference API)"
echo "Port  → ${PORT:-7860}"
echo "=================================="

cd /app
exec uvicorn backend.app.main:app \
  --host 0.0.0.0 \
  --port ${PORT:-7860} \
  --workers 1 \
  --log-level info