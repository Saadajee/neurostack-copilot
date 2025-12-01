# Neurostack Copilot


Neurostack Copilot is an offline-first AI documentation assistant that converts your PDFs, Markdown files, and internal knowledge base into a fully local, citation-grounded RAG system. Powered by a hybrid retrieval pipeline , FAISS semantic search + BM25 keyword matching + custom LLM re-ranking, it delivers precise answers backed by your actual content. No guessing, no fabricated responses, and no cloud dependencies.

Running on local Ollama models, Neurostack Copilot guarantees zero data leakage while providing real-time streaming answers, confidence gating, and complete source transparency. With a modern React + Tailwind interface, built-in analytics, multi-user authentication, and FastAPI backend, it functions as a production-ready AI support agent you can deploy inside any team or ship alongside any product.

Designed for engineering teams, product docs, customer support, and internal knowledge workflows , Neurostack Copilot brings accurate, private, blazing-fast AI search to your documentation, entirely on your machine.

Built by: Saad (November 2025)

**Live Demo**: [https://neurostack-copilot.vercel.app](https://neurostack-copilot.vercel.app)  
**Backend (FastAPI + Groq/LLM)**: [https://saadajee-neurostack-copilot.hf.space](https://saadajee-neurostack-copilot.hf.space)

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
| Frontend      | React 18, Vite, Tailwind CSS, Recharts, lucide-react |
| Backend       | FastAPI, LangChain, sentence-transformers, FAISS, BM25 |
| LLM           | Ollama (local) / Groq (cloud demo)                |
| Vector Store  | FAISS (in-memory)                                 |
| Auth          | JWT + SQLite                                      |
| Hosting       | **Frontend**: Vercel<br>**Backend**: Hugging Face Spaces |

# Quick Start (For local Deployment)

```
git clone https://github.com/yourusername/neurostack-copilot.git
cd neurostack-copilot
```
## Backend setup
```
conda create -n neurostack python=3.11 -y
conda activate neurostack
conda install pytorch torchvision torchaudio pytorch-cuda=12.9 -c pytorch -c nvidia  # For sentence-transformers GPU
conda install -c conda-forge faiss-cpu
pip install -r requirements.txt
```

## Frontend setup
In a new terminal
```
cd ../frontend
npm install
```

## Terminal 1 - Ollama
```
ollama run gemma3:4b
```
**_or: ollama run llama3.1:8b, mistral-nemo, qwen2.5:14b, etc._**

## Terminal 2 - Backend
```
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Terminal 3 - Frontend
```
cd frontend
npm run dev
```
# Developer Guide

Want to customize Neurostack Copilot? Here's where everything lives.

### Backend Structure (FastAPI)

**_backend/app/_**
* _rag/_ — Embedding, indexing, hybrid retrieval, reranking
* _llm/_ — Local LLM wrapper, streaming utilities
* _routers/_ — API endpoints (chat, auth, analytics)
* _db/_ — SQLite ORM models
* _schemas/_ — Pydantic models
* _core/_ — global config + security

You can extend retrieval logic, integrate new embedding models, or plug in your own LLM provider.

### Frontend Structure (React)

**_frontend/src/_**
* _pages/_ — Chat, Login, Register, Dashboard
* _components/_ — UI widgets UI widgets (MessageBubble, ChatBox, RetrievedChunks, DarkModeToggle, etc.)
*_app/_* Entry + routing
* _services/api.js_ — all HTTP calls (axios wrapper + interceptors)

The entire UI is modular and can be embedded inside another product.

## Known Limitations

* **Index stored in memory** → large datasets (>500k chunks) may require persistent FAISS or disk-backed stores.
* **Embedding build time grows with dataset size** → GPU strongly recommended.
* **LLM responses depend on model quality** → small models may miss nuance; larger ones require more VRAM.
* **No role-based access control yet** → all authenticated users currently share the same feature set.
* **Analytics are basic** → can be extended with more granular logging and custom metrics.

These will be addressed in future updates.

## Contributing
Pull requests are very welcome and will be merged fast! The biggest impact you can make right now:

- **Smarter chunking & overlap strategies** – recursive, semantic, or metadata-aware splitting for even higher retrieval precision  
- **Persistent + scalable vector stores** – disk-backed FAISS, PGVector, Qdrant, or Chroma integration for million-document scale  
- **Advanced analytics & time-series dashboards** – query heatmaps, per-user usage, accuracy over time, leaderboards  
- **Role-based access control (RBAC)** – admin, editor, viewer roles + team/organization support  
- **New UI components & themes** – light mode polish, markdown export, answer sharing, mobile PWA improvements  
- **Pluggable LLM & embedding backends** – easy switching between Ollama, Groq, OpenAI, Anthropic, Cohere, Voyage, etc.

A full contribution guide will be added soon.

## Support & Contact

For bugs, feature requests, or integration help:

📧 [saadimra7667@gmail.com](saadimran7667@gmail.com)

Happy to collaborate, debug, or help you extend the project further.

# Final Notes

Neurostack Copilot is built to be simple to run, easy to extend, and safe to deploy.
* Your documents stay offline.
* Your data stays yours.
* Your assistant finally gives answers faster compared to manual search that will take your precious time and energy.
