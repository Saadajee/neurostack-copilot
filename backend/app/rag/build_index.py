# backend/app/rag/build_index.py
import json
import os
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
from rank_bm25 import BM25Okapi

# ───── PATHS (works everywhere) ─────
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
DATA_DIR = os.path.join(PROJECT_ROOT, "app", "data")

faqs_path = os.path.join(DATA_DIR, "faqs.json")
index_path = os.path.join(DATA_DIR, "index.faiss")
bm25_path = os.path.join(DATA_DIR, "bm25_index.pkl")

print(f"Looking for FAQs at: {faqs_path}")

if not os.path.exists(faqs_path):
    raise FileNotFoundError(f"faqs.json NOT FOUND at {faqs_path}")

# Load FAQs
with open(faqs_path, "r", encoding="utf-8") as f:
    faqs = json.load(f)

questions = []
answers = []
valid_faqs = []

print(f"Total entries in faqs.json: {len(faqs)}")

for i, item in enumerate(faqs):
    if isinstance(item, dict) and "question" in item and "answer" in item:
        q = str(item["question"]).strip()
        a = str(item["answer"]).strip()
        if q and a:
            questions.append(q)
            answers.append(a)
            valid_faqs.append(item)
        else:
            print(f"Skipping empty Q/A at index {i}")
    else:
        print(f"Skipping invalid entry at index {i}: {item}")

print(f"Loaded {len(questions)} valid FAQs")

if len(questions) == 0:
    raise ValueError("No valid FAQs found! Check your faqs.json format.")

# ───── EMBEDDINGS + FAISS (100% safe) ─────
print("Loading embedding model...")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

print("Generating embeddings...")
embeddings = model.encode(
    questions,
    batch_size=32,
    show_progress_bar=True,
    convert_to_numpy=True,
    normalize_embeddings=True  # ← This helps FAISS
)

print(f"Embeddings shape: {embeddings.shape}")  # Should be (N, 384)

# Create FAISS index
dimension = embeddings.shape[1]
print(f"Creating FAISS index with dimension {dimension}")

index = faiss.IndexFlatL2(dimension)
index.add(embeddings)  # ← No need for .astype() — already float32
faiss.write_index(index, index_path)
print(f"FAISS index saved → {index_path} ({index.ntotal} vectors)")

# ───── BM25 ─────
print("Building BM25 index...")
tokenized = [q.lower().split() for q in questions]
bm25 = BM25Okapi(tokenized)

with open(bm25_path, "wb") as f:
    pickle.dump({
        "bm25": bm25,
        "questions": questions,
        "answers": answers,
        "faqs": valid_faqs
    }, f)

print(f"BM25 index saved → {bm25_path}")
print("\nSUCCESS! Indexes built perfectly.")
print("Now run: uvicorn app.main:app --reload")