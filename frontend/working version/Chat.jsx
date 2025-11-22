// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/ChatBox";
import MessageBubble from "../components/MessageBubble";
import RetrievedChunks from "../components/RetrievedChunks";
import Auth from "../components/Auth";
import DarkModeToggle from "../components/DarkModeToggle";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // This ref keeps setUser alive even if component unmounts/remounts
  const setUserRef = useRef();
  useEffect(() => {
    setUserRef.current = setUser;
  }, [setUser]);

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    if (token && email) {
      setUserRef.current?.({ email });
      const saved = localStorage.getItem(`messages_${email}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          setMessages([]);
        }
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`messages_${user.email}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Stable addMessage
  const addMessage = useCallback(
    ({ query, answer = "", chunks = [], streaming = false }) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];

        if (streaming && lastMsg?.type === "bot" && lastMsg.isStreaming) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              text: answer || lastMsg.text,
              chunks: chunks.length > 0 ? [...chunks] : lastMsg.chunks || [],
            },
          ];
        }

        const userExists = prev.some(
          (m) => m.type === "user" && m.text === query
        );
        if (!userExists) {
          return [
            ...prev,
            { type: "user", text: query },
            {
              type: "bot",
              text: answer || "Thinking...",
              chunks: [...chunks],
              isStreaming: true,
            },
          ];
        }

        if (!streaming && lastMsg?.type === "bot") {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              text: answer || lastMsg.text,
              chunks: chunks.length > 0 ? [...chunks] : lastMsg.chunks || [],
              isStreaming: false,
            },
          ];
        }

        return prev;
      });
    },
    []
  );

  const clearChat = () => {
    if (confirm("Start a new chat?")) {
      setMessages([]);
      if (user?.email) localStorage.removeItem(`messages_${user.email}`);
    }
  };

  const logout = () => {
    if (confirm("Logout now?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      window.location.href = "/auth";
    }
  };

  // THE UNBREAKABLE onLogin
  if (!user) {
    return (
      <Auth
        onLogin={(userData) => {
          setUserRef.current?.(userData);
          navigate("/", { replace: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur sticky top-0 z-40">

        <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Neurostack Copilot
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Logged in as <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <button
              onClick={() => navigate("/analytics")}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium shadow-lg transition transform hover:scale-105"
            >
              Analytics
            </button>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              New Chat
            </button>
            <button
              onClick={logout}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-lg transition"
            >
              Logout
            </button>
          </div>
        </header>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 max-w-5xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center mt-32">
            <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-300">
              Ask me anything
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4">
              Your Neurostack knowledge base is ready
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} type={msg.type}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {msg.text || (msg.isStreaming ? "Thinking..." : "...")}
            </div>
            {msg.type === "bot" && (
              <div className="mt-4">
                {msg.chunks?.length > 0 ? (
                  <RetrievedChunks chunks={msg.chunks} />
                ) : msg.isStreaming ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic animate-pulse">
                    Searching knowledge base...
                  </div>
                ) : null}
              </div>
            )}
          </MessageBubble>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* FLOATING PROMPT BAR (added) */}
      <div className="fixed bottom-4 left-0 w-full flex justify-center px-4 z-30">
        <div className="w-full max-w-4xl">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/60 shadow-xl border border-white/20 dark:border-gray-700/40 rounded-2xl p-4">
            <ChatBox onSend={addMessage} />
          </div>
        </div>
      </div>

    </div>
  );
}
