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

  const setUserRef = useRef();
  useEffect(() => {
    setUserRef.current = setUser;
  }, [setUser]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`messages_${user.email}`, JSON.stringify(messages));
    }
  }, [messages, user]);

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

        const userExists = prev.some((m) => m.type === "user" && m.text === query);
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
      Object.keys(localStorage)
        .filter(key => key.startsWith("messages_"))
        .forEach(key => localStorage.removeItem(key));
      setUserRef.current?.(null);
      setUser(null);
      navigate("/auth", { replace: true });
    }
  };

  if (!user) {
    return (
      <Auth
        onLogin={(userData) => {
          setUser(userData);
          navigate("/", { replace: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-black dark:to-gray-950 flex flex-col relative overflow-hidden">

      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-32 -left-60 w-96 h-96 bg-purple-600/4 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 -right-60 w-80 h-80 bg-pink-600/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/3 rounded-full blur-3xl" />
      </div>

      <header className="border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/90 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Neurostack Copilot
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Logged in as <span className="font-bold text-purple-600 dark:text-purple-300">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DarkModeToggle />

            <button
              onClick={() => navigate("/analytics")}
              className="px-6 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold text-sm shadow-lg hover:scale-105 transition flex items-center justify-center"
            >
              Analytics
            </button>

            <button
              onClick={clearChat}
              className="px-6 h-12 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-full text-gray-800 dark:text-white font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition flex items-center justify-center"
            >
              New Chat
            </button>

            <button
              onClick={logout}
              className="px-6 h-12 bg-red-600 rounded-full text-white font-bold text-sm hover:bg-red-700 transition flex items-center justify-center"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-40">
        <div className="max-w-4xl mx-auto w-full space-y-6">

          {messages.length === 0 && (
            <div className="text-center mt-32">
              <h2 className="text-6xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Ask me anything
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-400 mt-6">Your Neurostack knowledge base is ready</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-2xl w-full">
                <MessageBubble type={msg.type} message={msg}>
                  <div className="text-lg leading-relaxed">
                    {msg.isStreaming ? (
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">Thinking</span>
                        <div className="flex gap-2">
                          {[0, 150, 300].map((d) => (
                            <div
                              key={d}
                              className="w-2.5 h-2.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${d}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-800 dark:text-gray-100">{msg.text || "..."}</span>
                    )}
                  </div>

                  {msg.type === "bot" && msg.chunks?.length > 0 && !msg.isStreaming && (
                    <div className="mt-5">
                      <RetrievedChunks chunks={msg.chunks} />
                    </div>
                  )}
                </MessageBubble>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-6 flex justify-center z-50 pointer-events-none">
        <div className="w-full max-w-4xl px-6 pointer-events-auto">
          <div className="relative">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-full shadow-xl">
              <ChatBox onSend={addMessage} />
            </div>

            <div className="absolute inset-x-0 -bottom-8 h-16 bg-purple-600/8 blur-3xl rounded-full pointer-events-none opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
