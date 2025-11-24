# backend/app/rag/pipeline.py
import requests
import json
import os
from app.core.config import settings
from app.rag.hybrid_retriever import hybrid_search
from app.rag.validator import validate_relevance

# ──────── BULLETPROOF HF SPACE DETECTION ────────
IS_HF_SPACE = any([
    os.getenv("HF_SPACE_ID"),
    os.getenv("SPACE_ID"),
    os.getenv("SYSTEM_PROMPT"),
    "huggingface" in str(os.getenv("HOSTNAME", "")),
    "hf.space" in str(os.getenv("HOSTNAME", "")),
    os.path.exists("/etc/hf-space"),
    os.path.exists("/var/lib/hf-space"),
])

if IS_HF_SPACE:
    print("\n" + "="*80)
    print("HUGGING FACE SPACE DETECTED → USING GROQ + llama-3.1-8b-instant")
    print("="*80 + "\n")
else:
    print("Local dev → using Ollama")


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

    # ─────────────────── PRODUCTION: GROQ (llama-3.1-8b-instant) ───────────────────
    if IS_HF_SPACE:
        try:
            from groq import Groq

            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY missing! Add it in HF Spaces Secrets")

            client = Groq(api_key=settings.GROQ_API_KEY)

            stream = client.chat.completions.create(
                model="llama-3.1-8b-instant",        # ← locked exactly as you want
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=512,
                stream=True
            )

            # This is the OFFICIAL 2025 Groq SDK way (matches their example)
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

            return  # success → stop here

        except Exception as e:
            print(f"[GROQ ERROR] {e}")
            yield "Sorry, I'm having a moment. Try again in 5 seconds."
            return

    # ─────────────────── LOCAL DEV: OLLAMA (100% UNTOUCHED) ───────────────────
    try:
        response = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": settings.OLLAMA_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.2,
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
    print(f"[CONTEXT SENT TO GROQ (llama-3.1-8b-instant)] {len(context)} chars")

    full_answer = ""
    try:
        for token in stream_answer(query, context):
            full_answer += token
            yield {"token": token}
        yield {"answer": full_answer.strip() or "No answer generated."}
        yield {"chunks": chunks}
        print("[STREAM SUCCESS] Answer sent")
    except Exception as e:
        print(f"[STREAM FAILED] {e}")
        yield {"answer": full_answer.strip() or "Sorry, the model took too long."}
        yield {"chunks": chunks}
        print("[FALLBACK] Final chunks sent anyway")
    print("[STREAM COMPLETE]")
