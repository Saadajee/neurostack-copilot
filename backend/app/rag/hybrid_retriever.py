# backend/app/rag/hybrid_retriever.py
import os
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import traceback

# PATHS
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(CURRENT_DIR, "..", "data")
INDEX_PATH = os.path.join(DATA_DIR, "index.faiss")
BM25_PATH = os.path.join(DATA_DIR, "bm25_index.pkl")

# Global variables (will be set after loading)
faiss_index = None
bm25 = None
questions = []
answers = []
faqs = []
embedder = None

# SAFE LOADING WITH FULL ERROR REPORT
try:
    print("Loading FAISS index...")
    if not os.path.exists(INDEX_PATH):
        raise FileNotFoundError(f"index.faiss NOT FOUND at {INDEX_PATH}")

    faiss_index = faiss.read_index(INDEX_PATH)
    print(f"FAISS loaded: {faiss_index.ntotal} vectors")

    print("Loading BM25 index...")
    if not os.path.exists(BM25_PATH):
        raise FileNotFoundError(f"bm25_index.pkl NOT FOUND at {BM25_PATH}")

    with open(BM25_PATH, "rb") as f:
        bm25_data = pickle.load(f)

    bm25 = bm25_data["bm25"]
    questions = bm25_data["questions"]
    answers = bm25_data["answers"]
    faqs = bm25_data["faqs"]

    print(f"BM25 loaded: {len(questions)} FAQs")

    print("Loading embedding model...")
    embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    print("Embedding model loaded")

    print("\nHYBRID RETRIEVER FULLY LOADED AND READY!")
    print("=" * 60)

except Exception as e:
    print("\nFATAL ERROR: RAG INDEXES FAILED TO LOAD!")
    print(f"Error: {e}")
    print("Traceback:")
    traceback.print_exc()
    print("\nFIX THIS NOW:")
    print("1. Run: python app/rag/build_index.py")
    print("2. Make sure faqs.json exists and has valid Q&A")
    print("3. Restart the server")
    print("=" * 60)
    raise  # Crash the app — better than silent failure


# Hybrid search
def hybrid_search(query: str, k: int = 5, alpha: float = 0.75):
    query_emb = embedder.encode(query, convert_to_numpy=True, normalize_embeddings=True)
    query_emb = np.expand_dims(query_emb, axis=0).astype(np.float32)

    # FAISS
    faiss_distances, faiss_indices = faiss_index.search(query_emb, k * 2)
    faiss_scores = 1.0 / (1.0 + faiss_distances[0])

    # BM25
    bm25_scores = np.array(bm25.get_scores(query.lower().split()))

    # RRF Fusion
    all_scores = np.zeros(len(questions))
    rank = 1
    for idx in faiss_indices[0]:
        if idx < len(all_scores) and idx != -1:
            all_scores[idx] += alpha * (1.0 / (rank + 60))
            rank += 1

    rank = 1
    top_bm25 = np.argsort(-bm25_scores)[:k * 2]
    for idx in top_bm25:
        all_scores[idx] += (1 - alpha) * (1.0 / (rank + 60))
        rank += 1

    top_indices = np.argsort(-all_scores)[:k]
    results = []
    for idx in top_indices:
        if idx >= len(questions):
            continue
        results.append({
            "question": questions[idx],
            "answer": answers[idx],
            "score": round(float(all_scores[idx]), 4),
            "source": "faqs.json"
        })

    return results


if __name__ == "__main__":
    print("Testing hybrid search...")
    results = hybrid_search("how to change password", k=3)
    for r in results:
        print(f"{r['score:0.4f']} → {r['question']}")
