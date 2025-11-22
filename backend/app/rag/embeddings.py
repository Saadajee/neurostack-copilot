from sentence_transformers import SentenceTransformer

def get_embedding_model():
    return SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

embedder = get_embedding_model()

def embed_text(texts):
    return embedder.encode(texts, normalize_embeddings=True).tolist()
