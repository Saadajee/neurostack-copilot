# backend/app/routes/rag_routes.py
from fastapi import APIRouter, Header, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.rag.pipeline import stream_rag_pipeline
from app.core.security import decode_token  # your JWT decode function
import json

router = APIRouter(prefix="/rag")

# In-memory chat history (replace with DB later if you want)
user_chats = {}

# Request schema
class RAGQuery(BaseModel):
    query: str

# Auth dependency
def get_current_user(Authorization: str = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    
    token = Authorization.split("Bearer ")[-1].strip()
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return username

@router.get("/history")
async def get_chat_history(current_user: str = Depends(get_current_user)):
    return user_chats.get(current_user, [])


@router.post("/query")
async def rag_query_stream(
    payload: RAGQuery,
    current_user: str = Depends(get_current_user)
):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    async def event_generator():
        answer_so_far = ""
        final_chunks = []

        try:
            async for data in stream_rag_pipeline(query):
                # Stream tokens
                if "token" in data:
                    token = data["token"]
                    answer_so_far += token
                    yield f"data: {json.dumps({'token': token})}\n\n"

                # Full answer fallback
                if "answer" in data:
                    answer_so_far = data["answer"]
                    yield f"data: {json.dumps({'answer': answer_so_far})}\n\n"

                # Send chunks when available
                if "chunks" in data:
                    final_chunks = data["chunks"]
                    yield f"data: {json.dumps({'chunks': final_chunks})}\n\n"

            # Always send final state + DONE
            yield f"data: {json.dumps({'answer': answer_so_far.strip() or 'No response'})}\n\n"
            yield f"data: {json.dumps({'chunks': final_chunks})}\n\n"
            yield "data: [DONE]\n\n"

            # Save to history
            if current_user not in user_chats:
                user_chats[current_user] = []
            user_chats[current_user].append({
                "query": query,
                "answer": answer_so_far.strip(),
                "chunks": final_chunks,
                "timestamp": __import__('time').time()
            })

        except Exception as e:
            error_msg = "Sorry, something went wrong on the server."
            yield f"data: {json.dumps({'answer': error_msg})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Encoding": "identity",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )