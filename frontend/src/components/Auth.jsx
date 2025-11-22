// frontend/src/components/Auth.jsx
import { useState } from "react";
import client from "../api/axiosClient";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await client.post(endpoint, { username: email, password });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("email", email); // ← keep this if you use it elsewhere
      onLogin({ email });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Network error — check backend");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 -right-32 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-md mx-6">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-10">
          <div className="text-center mb-10">
            <h1 className="text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Neurostack
            </h1>
            <p className="text-xl text-white/70 mt-2 tracking-wider">Copilot</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all backdrop-blur"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all backdrop-blur"
              required
            />

            <button
              type="submit"
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg tracking-wide shadow-xl hover:scale-105 hover:shadow-purple-600/70 transition-all duration-300"
            >
              {isLogin ? "Enter Neurostack" : "Join the Future"}
            </button>

            {error && (
              <p className="text-red-400 text-center font-medium bg-red-500/10 py-3 rounded-xl border border-red-500/30">
                {error}
              </p>
            )}

            <p className="text-center text-white/60">
              {isLogin ? "New here? " : "Already in? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-purple-400 hover:text-pink-400 underline-offset-4 hover:underline transition"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}