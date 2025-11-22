import faiss
import os
import json
from app.rag.embeddings import embed_text

FAISS_PATH = "app/data/index.faiss"
FAQ_PATH = "app/data/faqs.json"

class VectorStore:
    def __init__(self):
        self.index = None
        self.texts = []

    def load(self):
        if os.path.exists(FAISS_PATH):
            self.index = faiss.read_index(FAISS_PATH)
        if os.path.exists(FAQ_PATH):
            self.texts = json.load(open(FAQ_PATH, "r"))

    def search(self, query, k=5):
        if not self.index:
            return []
        q_emb = embed_text([query])
        D, I = self.index.search(q_emb, k)
        return [(self.texts[i], float(D[0][idx])) for idx, i in enumerate(I[0])]

vector_store = VectorStore()
vector_store.load()
