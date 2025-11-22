# backend/app/rag/pipeline.py
import requests
import json
from app.core.config import settings
from app.rag.hybrid_retriever import hybrid_search
from app.rag.validator import validate_relevance

OLLAMA_URL = f"{settings.OLLAMA_BASE_URL}/api/generate"

def stream_answer(query: str, context: str):
    prompt = f"""You are Neurostack Copilot — a world-class, friendly IT support assistant.

INSTRUCTIONS (follow exactly):
1. Use ONLY the information from the context below.
2. NEVER copy the FAQ answer word-for-word. Always rephrase it naturally and conversationally.
3. Make it sound like you're talking to a teammate — warm, clear, confident.
4. Keep it short and direct.
5. If context doesn't have the answer → say: "I don't have enough information to help with that right now."

Context:
{context}

User Question: {query}

Answer in a natural, human way (do NOT repeat the FAQ verbatim):"""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.2,   # Natural but safe
                    "num_ctx": 4096,
                }
            },
            stream=True,
            timeout=120
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                if data.get("done"):
                    break
                token = data.get("response", "")
                if token.strip():
                    yield token

    except Exception as e:
        print(f"[OLLAMA ERROR] {e}")
        yield "Sorry, I'm having trouble connecting to the model right now. Please try again in a moment."


async def stream_rag_pipeline(query: str):
    print(f"\n[QUERY] {query}")
    results = hybrid_search(query, k=6, alpha=0.75)
    
    print(f"[RETRIEVED] {len(results)} chunks, scores: {[r['score'] for r in results]}")

    if not validate_relevance(results, threshold=0.008):
        print("[BLOCKED] Low relevance")
        yield {"answer": "I don't have enough information to answer this accurately."}
        yield {"chunks": []}
        return

    chunks = [
        {
            "question": r["question"],
            "answer": r["answer"],
            "score": round(r["score"], 4),
            "source": r["source"]
        }
        for r in results
    ]

    context = "\n\n".join([f"Q: {r['question']}\nA: {r['answer']}" for r in results])
    print(f"[CONTEXT SENT TO OLLAMA] {len(context)} chars")

    full_answer = ""
    try:
        for token in stream_answer(query, context):
            full_answer += token
            yield {"token": token}

        # SUCCESS: send final answer + chunks
        yield {"answer": full_answer.strip() or "No answer generated."}
        yield {"chunks": chunks}
        print("[STREAM SUCCESS] Answer sent")

    except Exception as e:
        print(f"[STREAM FAILED] {e}")
        # EVEN IF STREAMING DIES — SEND FINAL DATA
        yield {"answer": full_answer.strip() or "Sorry, the model took too long."}
        yield {"chunks": chunks}
        print("[FALLBACK] Final chunks sent anyway")

    print("[STREAM COMPLETE]")