// frontend/src/components/MessageBubble.jsx
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MessageBubble({ type, children, message }) {
  const isUser = type === "user";
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const sendFeedback = async (rating) => {
    if (feedbackGiven) return;

    const token = localStorage.getItem("token");

    // Optimistic UI + instant analytics update
    setFeedbackGiven(true);

    // UPDATE ANALYTICS GRAPH IMMEDIATELY
    window.dispatchEvent(
      new CustomEvent("feedback-updated", {
        detail: { rating }, // "good" or "bad"
      })
    );

    try {
      await fetch(`${import.meta.env.VITE_API_BASE}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: message?.query || "User query",
          answer: message?.text || "",
          rating,
        }),
      });

      toast.success("Thanks for your feedback!", {
        style: { borderRadius: "12px", background: "#1a1a1a", color: "#fff" },
        icon: "Thank you",
      });
    } catch (err) {
      console.error("Feedback failed to send:", err);
      toast.error("Feedback failed (but we counted it anyway)", {
        style: { borderRadius: "12px", background: "#1a1a1a", color: "#fff" },
      });
      // Still keep it as given — user experience first
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={isUser ? "max-w-lg" : "max-w-2xl"}>
        <div
          className={`px-5 py-3.5 rounded-2xl transition-all duration-200 shadow-md
            ${isUser
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-600/40 dark:shadow-purple-600/60"
              : "bg-white/90 dark:bg-gray-800/80 border border-gray-200/70 dark:border-white/10 text-gray-900 dark:text-gray-100 backdrop-blur-sm"
            }
            `}
        >
          <div className="text-base leading-relaxed whitespace-pre-wrap">{children}</div>

          {!isUser && !message?.isStreaming && (
            <div className="mt-4 pt-3 border-t border-gray-300/50 dark:border-white/10 flex items-center gap-4">
              <button
                onClick={() => sendFeedback("good")}
                disabled={feedbackGiven}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition group"
                title="This was helpful"
              >
                <ThumbsUp
                  size={18}
                  className={`transition-all ${
                    feedbackGiven && message?.rating === "good"
                      ? "text-green-600 dark:text-green-400 scale-125"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-green-500"
                  }`}
                />
              </button>

              <button
                onClick={() => sendFeedback("bad")}
                disabled={feedbackGiven}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition group"
                title="This needs improvement"
              >
                <ThumbsDown
                  size={18}
                  className={`transition-all ${
                    feedbackGiven && message?.rating === "bad"
                      ? "text-red-600 dark:text-red-400 scale-125"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-red-500"
                  }`}
                />
              </button>

              {feedbackGiven && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium animate-fade-in">
                  Thanks for your feedback!
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
