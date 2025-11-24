// frontend/src/components/ChatBox.jsx
import { useState, useRef, useEffect } from "react";
import client from "../api/axiosClient"; // ← This is the key — uses VITE_API_BASE

export default function ChatBox({ onSend }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput("");
    onSend({ query, answer: "", chunks: [], streaming: true });
    setLoading(true);

    // 1. Increment query counter (fire and forget — your counter stays intact)
    client.post("/increment-query").catch(() => {
      console.log("Query counter failed (not critical)");
    });

    let fullAnswer = "";
    let chunks = [];

    try {
      const response = await client.post("/rag/query", { query }, {
        responseType: "stream"  // ← ONLY for this request
      });

      const stream = response.data;
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 1);

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullAnswer += data.token;
                onSend({ query, answer: fullAnswer, chunks, streaming: true });
              }
              if (data.chunks) chunks = data.chunks;
              if (data.answer) {
                fullAnswer = data.answer;
                onSend({ query, answer: fullAnswer, chunks, streaming: false });
              }
            } catch (e) {}
          }
          boundary = buffer.indexOf("\n");
        }
      }

      onSend({ query, answer: fullAnswer || "Done.", chunks, streaming: false });

    } catch (err) {
      console.error("RAG query failed:", err);
      onSend({
        query,
        answer: "Server is offline or unreachable.",
        chunks: [],
        streaming: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={send} className="flex items-center w-full px-6 py-4">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send(e);
          }
        }}
        placeholder="Ask anything about Neurostack..."
        rows={1}
        disabled={loading}
        autoFocus
        className="flex-1 resize-none bg-transparent
                   text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none text-base leading-relaxed max-h-32 pr-16
                   scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      />

      <button
        type="submit"
        disabled={loading || !input.trim()}
        className={`ml-4 p-3 rounded-full transition-all duration-200 flex-shrink-0
          ${input.trim() && !loading
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
            : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          } ${loading ? "animate-pulse" : ""}`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </form>
  );
}
