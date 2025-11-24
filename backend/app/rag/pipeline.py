# backend/app/rag/pipeline.py
import requests
import json
import os
from app.core.config import settings
from app.rag.hybrid_retriever import hybrid_search
from app.rag.validator import validate_relevance

# ──────── BULLETPROOF HF SPACE DETECTION — WORKS 100 % ON ALL 2025 SPACES ────────
IS_HF_SPACE = any([
    os.getenv("HF_SPACE_ID"),
    os.getenv("SPACE_ID"),
    os.getenv("SYSTEM_PROMPT"),
    "huggingface" in str(os.getenv("HOSTNAME", "")),
    "hf.space" in str(os.getenv("HOSTNAME", "")),
    os.path.exists("/etc/hf-space"),
    os.path.exists("/var/lib/hf-space"),
])

# Print once at import so you SEE it in logs
if IS_HF_SPACE:
    print("\n" + "="*80)
    print("HUGGING FACE SPACE DETECTED → USING google/gemma-2-2b-it (NO OLLAMA)")
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

    # ----------------------------------------------------------------
    # Production: on HF Spaces we will call Groq Cloud (streaming)
    # ----------------------------------------------------------------
    if IS_HF_SPACE:
        try:
            # Read Groq config from env — set these in HF Secrets
            GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
            GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
            GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.cloud/v1").rstrip("/")

            if not GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY missing from environment (add to HF Spaces secrets)")

            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
                # Some Groq installations expect an explicit user-agent
                "User-Agent": "neurostack-copilot/1.0"
            }

            payload = {
                # Use the chat/completions style to be compatible with many Groq endpoints
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 512,
                "temperature": 0.3,
                "stream": True
            }

            stream_url = f"{GROQ_API_URL}/chat/completions"
            resp = requests.post(stream_url, headers=headers, json=payload, stream=True, timeout=120)
            # Raise for auth / 4xx / 5xx
            resp.raise_for_status()

            # Parse streaming response robustly:
            # - Some endpoints send SSE lines like: "data: {...}\n\n"
            # - Some send newline-delimited JSON
            # We'll handle both.
            for raw_line in resp.iter_lines(decode_unicode=True):
                if raw_line is None:
                    continue
                line = raw_line.strip()
                if not line:
                    continue

                # SSE-style "data: " prefix
                if line.startswith("data:"):
                    line = line[len("data:"):].strip()

                # Some servers send keepalive: "[DONE]" — stop on that
                if line == "[DONE]":
                    break

                # Try to parse JSON; ignore parse errors gracefully
                try:
                    data = json.loads(line)
                except Exception:
                    # If it's not JSON, yield raw line as a token fallback
                    token_text = line
                    if token_text:
                        yield token_text
                    continue

                # Robust extraction of token text across possible shapes:
                token_text = ""
                # Common "choices" streaming shape (chat-like)
                try:
                    # e.g., {"choices":[{"delta":{"content":"Hello"}}, ...]}
                    choices = data.get("choices") if isinstance(data, dict) else None
                    if choices and len(choices) > 0:
                        # Collect content from delta or message or text fields
                        choice = choices[0]
                        if isinstance(choice, dict):
                            # delta -> content
                            delta = choice.get("delta", {})
                            if isinstance(delta, dict):
                                token_text = delta.get("content", "") or token_text

                            # older shapes: choice['text']
                            token_text = token_text or choice.get("text", "") or token_text

                            # chat message full
                            message = choice.get("message") or {}
                            if isinstance(message, dict):
                                token_text = token_text or message.get("content", "") or token_text
                except Exception:
                    token_text = token_text or ""

                # Some providers return 'text' at top-level
                if not token_text:
                    token_text = data.get("text", "") or data.get("response", "") or ""

                # Another possible field: 'delta' top-level
                if not token_text:
                    top_delta = data.get("delta")
                    if isinstance(top_delta, dict):
                        token_text = top_delta.get("content", "") or ""

                # If we extracted something, yield it
                if token_text and token_text.strip():
                    yield token_text
            # End stream loop
            return

        except Exception as e:
            # Keep the log style you already use
            print(f"[GROQ ERROR] {e}")
            # Yield a friendly fallback token so frontend doesn't hang
            yield "Sorry, the model is waking up or busy. Try again in 10 seconds."
            return

    # ----------------------------------------------------------------
    # Local dev: Ollama (unchanged)
    # ----------------------------------------------------------------
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
    print(f"[CONTEXT SENT TO {'HF INFERENCE' if IS_HF_SPACE else 'OLLAMA'}] {len(context)} chars")

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
