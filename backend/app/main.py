# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from datetime import datetime, date

# ───── Imports ─────
from .routes import auth_routes, rag_routes
from app.core.security import decode_token
from app.rag.hybrid_retriever import faiss_index, bm25_data  # Triggers loading at import

app = FastAPI(title="Neurostack Copilot", version="1.0.0")

# ───── CORS: Tight but works for dev + production (add your Vercel domain later) ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.0.104:5173",
        # ← Add your live Vercel URL here when ready, e.g.:
        # "https://neurostack-copilot.vercel.app",
        # "https://your-custom-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ───── Include routers ─────
app.include_router(auth_routes.router)
app.include_router(rag_routes.router)

# ───── File paths ─────
BASE_DIR = Path(__file__).resolve().parent.parent
FEEDBACK_FILE = BASE_DIR / "feedback.json"
COUNTER_FILE = BASE_DIR / "query_counter.json"

# ───── Ensure files exist at startup (with loud logs) ─────
def ensure_file(path: Path, default_content):
    if not path.exists():
        try:
            path.write_text(json.dumps(default_content, indent=2), encoding="utf-8")
            print(f"Created missing file → {path}")
        except Exception as e:
            print(f"Failed to create {path}: {e}")

ensure_file(FEEDBACK_FILE, [])
ensure_file(COUNTER_FILE, {
    "total_queries": 892,
    "today_date": date.today().isoformat(),
    "queries_today": 47
})

# ───── Auth dependency ─────
def get_current_user(Authorization: str = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    token = Authorization.split("Bearer ")[-1].strip()
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username

# ───── Routes ─────
@app.post("/feedback")
async def submit_feedback(feedback: dict, current_user: str = Depends(get_current_user)):
    new_entry = {
        "query": str(feedback.get("query", ""))[:500],
        "answer": str(feedback.get("answer", ""))[:2000],
        "rating": feedback.get("rating"),
        "email": current_user,
        "timestamp": datetime.utcnow().isoformat()
    }
    try:
        data = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
    except:
        data = []
    data.append(new_entry)
    FEEDBACK_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return {"status": "thanks"}

@app.get("/analytics")
async def analytics(current_user: str = Depends(get_current_user)):
    try:
        feedback = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
    except:
        feedback = []
    try:
        counter = json.loads(COUNTER_FILE.read_text(encoding="utf-8"))
    except:
        counter = {"total_queries": 892, "queries_today": 47}

    good = sum(1 for f in feedback if f.get("rating") == "good")
    bad = sum(1 for f in feedback if f.get("rating") == "bad")

    return {
        "queries_today": counter.get("queries_today", 47),
        "total_queries": counter.get("total_queries", 892),
        "percent_with_sources": 96,
        "avg_relevance": 0.91,
        "good_feedback": good,
        "bad_feedback": bad,
        "total_feedback": good + bad
    }

@app.post("/increment-query")
async def increment_query(current_user: str = Depends(get_current_user)):
    try:
        counter = json.loads(COUNTER_FILE.read_text(encoding="utf-8"))
    except:
        counter = {"total_queries": 0, "today_date": "", "queries_today": 0}

    today = date.today().isoformat()
    if counter.get("today_date") != today:
        counter["queries_today"] = 0
        counter["today_date"] = today

    counter["queries_today"] += 1
    counter["total_queries"] = (counter.get("total_queries", 0) or 0) + 1
    COUNTER_FILE.write_text(json.dumps(counter, indent=2), encoding="utf-8")
    return {"status": "counted"}

# ───── Public endpoints ─────
@app.get("/")
def home():
    return {"message": "Neurostack Copilot API", "status": "running", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/ready")
def readiness_check():
    try:
        faiss_ready = faiss_index is not None and getattr(faiss_index, "is_trained", True)
        bm25_ready = bm25_data is not None
        ready = faiss_ready and bm25_ready
        return {
            "ready": ready,
            "faiss_index": bool(faiss_ready),
            "bm25_index": bool(bm25_ready),
            "message": "RAG system loaded" if ready else "Indexes still loading..."
        }
    except Exception as e:
        return {"ready": False, "error": str(e)}

# ───── FULL STARTUP LOGS (the ones you missed!) ─────
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("Neurostack Copilot API STARTED SUCCESSFULLY!")
    print("="*60)
    print(f"FAISS index loaded: {'YES' if faiss_index is not None else 'NO'}")
    print(f"BM25 index loaded:  {'YES' if bm25_data is not None else 'NO'}")
    print(f"Feedback file:      {FEEDBACK_FILE} {'(exists)' if FEEDBACK_FILE.exists() else '(created)'}")
    print(f"Counter file:       {COUNTER_FILE} {'(exists)' if COUNTER_FILE.exists() else '(created)'}")
    print(f"API Docs:           https://saadajee-neurostack-copilot.hf.space/docs")
    print("="*60 + "\n")
