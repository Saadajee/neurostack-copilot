// frontend/src/components/ChatBox.jsx
import { useState } from "react";

export default function ChatBox({ onSend }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput("");
    
    // Show user message
    onSend({ query, answer: "", chunks: [], streaming: true });
    setLoading(true);

    let fullAnswer = "";
    let chunks = [];

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error("Network error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              onSend({ query, answer: fullAnswer, chunks, streaming: false });
              setLoading(false);
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullAnswer += data.token;
                onSend({ query, answer: fullAnswer, chunks, streaming: true });
              }
              if (data.chunks) {
                chunks = data.chunks;
              }
              if (data.answer) {
                fullAnswer = data.answer;
                onSend({ query, answer: fullAnswer, chunks, streaming: false });
              }
            } catch (e) {
              console.log("Ignored non-JSON line:", dataStr);
            }
          }
        }
      }

      // Final fallback
      onSend({ query, answer: fullAnswer || "No response received.", chunks, streaming: false });

    } catch (err) {
      console.error("ChatBox Error:", erratic);
      onSend({ query, answer: "Connection failed. Is backend running?", chunks: [], streaming: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={send} className="flex gap-4 p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything about Neurostack..."
        className="flex-1 px-6 py-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/30"
        disabled={loading}
        autoFocus
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
      >
        {loading ? "Thinking..." : "Send"}
      </button>
    </form>
  );
}