from rank_bm25 import BM25Okapi
import json

FAQ_PATH = "app/data/faqs.json"

class BM25Retriever:
    def __init__(self):
        self.docs = []
        if FAQ_PATH:
            try:
                self.docs = json.load(open(FAQ_PATH))
            except:
                pass

        tokenized = [d["content"].lower().split() for d in self.docs]
        self.bm25 = BM25Okapi(tokenized)

    def retrieve(self, query, k=5):
        scores = self.bm25.get_scores(query.lower().split())
        top = sorted(list(enumerate(scores)), key=lambda x: x[1], reverse=True)[:k]
        return [(self.docs[i], float(score)) for i, score in top]

bm25 = BM25Retriever()
