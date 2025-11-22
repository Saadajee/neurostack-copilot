// frontend/src/components/RetrievedChunks.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function RetrievedChunks({ chunks }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!chunks || chunks.length === 0) return null;

  const topChunks = chunks.slice(0, 5);

  return (
    <div className="mt-5">
      {/* Minimal collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300/20 dark:border-gray-700/30 rounded-xl hover:bg-white/10 dark:hover:bg-gray-800/70 transition-all duration-200 group text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Retrieved Sources • {chunks.length} found
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition" />
        )}
      </button>

      {/* Full expanded view with Question + Answer */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {topChunks.map((chunk, i) => {
            const relevance = (chunk.score * 100).toFixed(1);

            return (
              <div
                key={i}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Header: Rank + Question + Match */}
                <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-800/40">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                      {chunk.question || "Related source"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm ${
                        relevance >= 80
                          ? "bg-emerald-500"
                          : relevance >= 60
                          ? "bg-purple-500"
                          : relevance >= 40
                          ? "bg-orange-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {relevance}% match
                    </span>
                  </div>
                </div>

                {/* Full Answer */}
                <div className="px-6 pb-5 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Question:</span>
                      <p className="mt-1 text-gray-700 dark:text-gray-300">{chunk.question}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Answer:</span>
                      <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                        {chunk.answer || "No answer provided"}
                      </p>
                    </div>
                    <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-dashed border-gray-300 dark:border-gray-600">
                      Relevance: {relevance}% • Rank #{i + 1} of {chunks.length}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {chunks.length > 5 && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 italic pt-2">
              Showing top 5 of {chunks.length} sources
            </p>
          )}
        </div>
      )}
    </div>
  );
}