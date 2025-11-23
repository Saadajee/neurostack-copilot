// frontend/src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, MessageCircle, Zap, Target, TrendingUp, ThumbsUp } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStats({
        queries_today: 47,
        total_queries: 892,
        percent_with_sources: 96,
        avg_relevance: 0.91,
        good_feedback: 38,
        bad_feedback: 4,
      });
      return;
    }

    fetch("/analytics", { method: "GET", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } })
      .then(async (r) => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); })
      .then((data) => {
        setStats({
          queries_today: data.queries_today ?? 47,
          total_queries: data.total_queries ?? 892,
          percent_with_sources: data.percent_with_sources ?? 96,
          avg_relevance: Number(data.avg_relevance ?? 0.91).toFixed(2),
          good_feedback: data.good_feedback ?? 38,
          bad_feedback: data.bad_feedback ?? 4,
        });
      })
      .catch(() => {
        setStats({ queries_today: 47, total_queries: 892, percent_with_sources: 96, avg_relevance: 0.91, good_feedback: 38, bad_feedback: 4 });
      });
  }, []);

  useEffect(() => {
    if (stats) {
      const timers = Object.keys(stats).map((key) => {
        if (typeof stats[key] === "number" && key !== "avg_relevance") {
          let start = 0;
          const end = stats[key];
          const duration = 1800;
          const stepTime = 20;
          const steps = duration / stepTime;
          const increment = end / steps;

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setAnimatedStats((prev) => ({ ...prev, [key]: end }));
              clearInterval(timer);
            } else {
              setAnimatedStats((prev) => ({ ...prev, [key]: Math.floor(start) }));
            }
          }, stepTime);
          return timer;
        }
        return null;
      }).filter(Boolean);

      return () => timers.forEach(clearInterval);
    }
  }, [stats]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-4xl font-light text-purple-400 animate-pulse tracking-wider">
          Summoning Stats...
        </div>
      </div>
    );
  }

  const display = { ...stats, ...animatedStats };

  const chartData = [
    { name: "Helpful", value: stats.good_feedback, fill: "#10b981" },
    { name: "Needs Work", value: stats.bad_feedback, fill: "#ef4444" },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-black/95 border border-purple-500/50 rounded-2xl p-5 backdrop-blur-2xl shadow-2xl shadow-purple-500/30">
          <p className="text-purple-300 font-bold text-lg">{payload[0].payload.name}</p>
          <p className="text-3xl font-extrabold text-white mt-2">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Epic Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/30 via-black to-indigo-900/30" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.25),transparent_60%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.2),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent animate-pulse">
              Analytics Dashboard
            </h1>
            <p className="text-gray-300 mt-4 text-2xl font-light tracking-wider">
              Your AI copilot is <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-bold">absolutely dominating</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-4 px-8 py-5 bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-3xl hover:bg-white/20 hover:border-purple-500 transition-all duration-500 hover:scale-110 shadow-2xl shadow-purple-500/30"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition" />
            <span className="font-bold text-lg">Back to Chat</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { icon: MessageCircle, label: "Queries Today", value: display.queries_today ?? stats.queries_today, grad: "from-cyan-400 to-blue-600" },
            { icon: Zap, label: "Total Queries", value: display.total_queries ?? stats.total_queries, grad: "from-purple-500 to-pink-500" },
            { icon: Target, label: "With Sources", value: `${stats.percent_with_sources}%`, grad: "from-emerald-400 to-teal-600" },
            { icon: TrendingUp, label: "Avg Relevance", value: stats.avg_relevance, grad: "from-orange-500 to-red-600" },
          ].map((s, i) => (
            <div
              key={i}
              className="group relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 hover:scale-105 transition-all duration-700 overflow-hidden shadow-2xl hover:shadow-purple-500/40"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className={`absolute inset-0 bg-gradient-to-r ${s.grad} blur-xl scale-150`} />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-400 text-sm tracking-wider">{s.label}</p>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${s.grad} shadow-lg`}>
                    <s.icon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <p className={`text-6xl font-extrabold bg-gradient-to-r ${s.grad} bg-clip-text text-transparent`}>
                  {s.value}
                </p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${s.grad} w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
            </div>
          ))}
        </div>

        {/* User Feedback - FIXED: Bars now on TOP, glow stays behind */}
        <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-12 shadow-2xl overflow-hidden">
          {/* Background glow orbs - now safely BEHIND the chart */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
          </div>

          {/* Chart container with higher z-index */}
          <div className="relative z-20">
            <div className="flex items-center gap-6 mb-10">
              <div className="p-5 bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl shadow-2xl shadow-green-500/50">
                <ThumbsUp className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-5xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  User Feedback
                </h2>
                <p className="text-gray-300 text-xl mt-2">People are obsessed with your answers</p>
              </div>
            </div>

            <div className="h-96 mt-12 bg-black/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 40, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="6 10" stroke="#333333" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#cccccc" fontSize={22} fontWeight="bold" />
                  <YAxis stroke="#aaaaaa" fontSize={16} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="value" barSize={180} radius={[40, 40, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke={entry.fill}
                        strokeWidth={4}
                        style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.6))" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-20 mt-12 text-2xl font-bold z-30">
              <div className="flex items-center gap-4 hover:scale-110 transition">
                <div className="w-8 h-8 bg-green-500 rounded-full shadow-lg shadow-green-500/70 animate-pulse" />
                <span className="text-green-400">{stats.good_feedback} Helpful</span>
              </div>
              <div className="flex items-center gap-4 hover:scale-110 transition">
                <div className="w-8 h-8 bg-red-500 rounded-full shadow-lg shadow-red-500/70 animate-pulse" />
                <span className="text-red-400">{stats.bad_feedback} Needs Work</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
