# Neurostack Copilot  
**Your AI-Powered Support Assistant with Zero Hallucinations**

A production-ready RAG copilot with hybrid retrieval, streaming answers, source transparency, feedback loop, and a gorgeous analytics dashboard.

**Live Demo:** `http://localhost:5173` (when running)  
**Built by:** Saad — A+ Final Project (Nov 2025)

---

### Features

- **Hybrid Retrieval** — FAISS (semantic) + BM25 (keyword) with custom re-ranking  
- **Real-time Streaming** — Answers type out as they generate  
- **Source Transparency** — Shows retrieved chunks + relevance scores  
- **Hallucination Guardrails** — Rejects low-confidence queries  
- **Feedback System** — Thumbs Up / Thumbs Down → saved + reflected in analytics  
- **Stunning Analytics Dashboard** — Live stats + Recharts bar graph  
- **Dark Mode + Glassmorphism UI** — Looks like a $10M startup  
- **JWT Auth + Protected Routes** — Clean login flow  

---

### Tech Stack

| Layer         | Tools                                                                 |
|---------------|-----------------------------------------------------------------------|
| Backend       | FastAPI • LangChain • sentence-transformers • FAISS • BM25            |
| LLM           | Ollama (Llama 3.2 / Mistral / Gemma3:4b) — local & private            |
| Frontend      | React 18 • Vite • Tailwind CSS • Recharts • lucide-react              |
| Vector DB     | FAISS (in-memory, loaded at startup)                                  |
| Auth          | JWT + localStorage                                                    |

---

### Project Structure

neurostack-copilot/
├── backend/
│   ├── app/main.py              → FastAPI + /feedback + /analytics
│   ├── app/rag/                 → Hybrid retriever (FAISS + BM25)
│   └── data/feedback.json       → All user feedback stored here
│
├── frontend/
│   ├── src/pages/Chat.jsx       → Streaming chat + feedback buttons
│   ├── src/pages/Analytics.jsx  → Beautiful dashboard
│   └── src/components/          → MessageBubble, RetrievedChunks, etc.
│
└── README.md


---

### How to Run (3 Commands)

#### 1. Start Ollama (Local LLM)
#cmd
ollama run gemma3:4b     # or mistral, phi3, gemma2

### 2. Start backend (FastAPI)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

### 3. Start backend (FastAPI)
cd frontend
npm run dev
