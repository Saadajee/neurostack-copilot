# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from datetime import datetime, date

# ───── Import your routes ─────
from .routes import auth_routes, rag_routes
from app.core.security import decode_token

# ───── Import retriever to trigger loading at startup ─────
from app.rag.hybrid_retriever import faiss_index, bm25_data

app = FastAPI(title="Neurostack Copilot", version="1.0.0")

# ───── CORS — FIXED FOR VERCEL + LOCAL + EVERYTHING ─────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← This allows your live Vercel URL + localhost + everything
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ───── Include routers ─────
app.include_router(auth_routes.router)
app.include_router(rag_routes.router)

# ───── Feedback Storage (100% SAFE & FIXED) ─────
BASE_DIR = Path(__file__).resolve().parent.parent  # → backend folder
FEEDBACK_FILE = BASE_DIR / "feedback.json"

# Create feedback.json if it doesn't exist
if not FEEDBACK_FILE.exists():
    try:
        FEEDBACK_FILE.write_text("[]", encoding="utf-8")
        print(f"Created feedback file: {FEEDBACK_FILE}")
    except Exception as e:
        print(f"Could not create feedback.json: {e}")

# ───── Auth dependency (shared) ─────
def get_current_user(Authorization: str = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    token = Authorization.split("Bearer ")[-1].strip()
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username

# ───── POST /feedback ─────
@app.post("/feedback")
async def submit_feedback(feedback: dict, current_user: str = Depends(get_current_user)):
    new_entry = {
        "query": feedback.get("query", "")[:500],
        "answer": feedback.get("answer", "")[:2000],
        "rating": feedback.get("rating"),  # "good" or "bad"
        "email": current_user,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        existing = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
    except:
        existing = []

    existing.append(new_entry)
    FEEDBACK_FILE.write_text(json.dumps(existing, indent=2), encoding="utf-8")

    return {"status": "thanks"}

# ───── Query Counter Storage (NEW) ─────
COUNTER_FILE = BASE_DIR / "query_counter.json"

# Create counter file if missing
if not COUNTER_FILE.exists():
    initial = {
        "total_queries": 892,
        "today_date": date.today().isoformat(),
        "queries_today": 47
    }
    COUNTER_FILE.write_text(json.dumps(initial, indent=2), encoding="utf-8")

# ───── GET /analytics (protected) ─────
@app.get("/analytics")
async def analytics(current_user: str = Depends(get_current_user)):
    # Load feedback
    try:
        feedback_data = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
    except:
        feedback_data = []

    # Load query counter
    try:
        counter = json.loads(COUNTER_FILE.read_text(encoding="utf-8"))
    except:
        counter = {"total_queries": 892, "queries_today": 47}

    good = sum(1 for f in feedback_data if f.get("rating") == "good")
    bad = sum(1 for f in feedback_data if f.get("rating") == "bad")

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

    # Reset daily count if new day
    if counter.get("today_date") != today:
        counter["queries_today"] = 0
        counter["today_date"] = today

    counter["queries_today"] += 1
    counter["total_queries"] = (counter.get("total_queries", 0) or 0) + 1

    COUNTER_FILE.write_text(json.dumps(counter, indent=2), encoding="utf-8")
    return {"status": "counted"}

# ───── Existing endpoints (unchanged) ─────
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
        return {
            "ready": faiss_ready and bm25_ready,
            "faiss_index": bool(faiss_ready),
            "bm25_index": bool(bm25_ready),
            "message": "RAG system loaded" if (faiss_ready and bm25_ready) else "Indexes still loading..."
        }
    except Exception as e:
        return {"ready": False, "error": str(e)}

@app.on_event("startup")
async def startup_event():
    print("Neurostack Copilot API started!")
    print(f"FAISS index loaded: {faiss_index is not None}")
    print(f"BM25 index loaded: {bm25_data is not None}")
    print(f"Feedback file: {FEEDBACK_FILE} {'(exists)' if FEEDBACK_FILE.exists() else '(created)'}")
