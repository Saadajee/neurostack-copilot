# Neurostack Copilot
Your AI-Powered Support Assistant with Zero Hallucinations

Neurostack Copilot is a production-ready, fully local RAG (Retrieval-Augmented Generation) assistant that lets you chat with your own documents using offline LLMs. It combines hybrid retrieval, real-time streaming responses, source transparency, feedback collection, and a live analytics dashboard.

Built by: Saad (November 2025)

## Features
- Hybrid Retrieval: FAISS (semantic) + BM25 (keyword) with custom re-ranking
- Real-time Streaming Answers
- Full Source Transparency: displays retrieved chunks and relevance scores
- Hallucination Guardrails: rejects queries with low retrieval confidence
- Feedback System: thumbs up/down per answer, stored and visualized
- Live Analytics Dashboard with charts (queries over time, accuracy, etc.)
- Modern UI: glassmorphism design, dark mode, fully responsive
- Secure Multi-User Support: JWT authentication, user-isolated sessions, protected routes

## Tech Stack

| Layer         | Technologies                                      |
|---------------|---------------------------------------------------|
| Backend       | FastAPI, LangChain, sentence-transformers, FAISS, BM25 |
| LLM           | Ollama (default: gemma3:4b, fully local)          |
| Frontend      | React 18, Vite, Tailwind CSS, Recharts, lucide-react |
| Vector Store  | FAISS (in-memory, rebuilt on demand)              |
| Auth          | JWT + SQLite                                      |

## Quick Start


git clone https://github.com/yourusername/neurostack-copilot.git
cd neurostack-copilot

# Backend setup
conda create -n neurostack python=3.12 -y
conda activate neurostack
cd backend
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Terminal 1 - Ollama
ollama run gemma3:4b
# or: ollama run llama3.1:8b, mistral-nemo, qwen2.5:14b, etc.

# Terminal 2 - Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 - Frontend
cd frontend
npm run dev

Adding Your Documents

Place PDF, DOCX, TXT, or MD files in:textbackend/app/data/
Build/rebuild the index:Bashcd backend
python app/rag/build_index.py

Your knowledge base is immediately available.
Configuration (backend/.env)
textOLLAMA_MODEL=gemma3:4b
OLLAMA_BASE_URL=http://localhost:11434
PORT=8000
ALLOW_REGISTRATION=true   # set to false after creating accounts
JWT_SECRET=your-very-long-secret-key-here
API Endpoints

POST /api/chat           → streaming response + sources
POST /api/build-index    → rebuild document index
POST /api/login          → authenticate user
POST /api/register       → create new user
GET  /api/analytics      → live statistics

Notes

100% local - no data ever leaves your machine
Supports multiple concurrent users with isolated sessions
Works offline after initial Ollama model download
Responsive design with dark mode toggle

Ready to run. No external APIs. No subscriptions. Just your data and your model.
