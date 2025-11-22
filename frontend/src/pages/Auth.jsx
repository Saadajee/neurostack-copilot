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

      const res = await client.post(endpoint, {
        username: email,
        password,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("email", email);
      localStorage.setItem("last_email_for_theme", email); // ← your genius line, preserved

      onLogin({ email });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Network error — check backend"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* GOD-TIER ANIMATED BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(168,85,247,0.4),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.4),transparent_70%)]" />
        
        {/* Floating orbs — same blood as chat page */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 -right-32 w-80 h-80 bg-pink-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* MAIN CARD — glassmorphism perfection */}
      <div className="relative w-full max-w-md mx-6">
        <div className="bg-white/10 dark:bg-black/40 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Inner glow border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 blur-xl" />
          
          <div className="relative p-10">
            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent drop-shadow-2xl">
                Neurostack
              </h1>
              <p className="text-2xl font-light text-white/80 mt-3 tracking-wider">Copilot</p>
            </div>

            <form onSubmit={submit} className="space-y-7">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 text-lg rounded-2xl bg-white/10 dark:bg-white/5 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 backdrop-blur-xl"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 text-lg rounded-2xl bg-white/10 dark:bg-white/5 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 backdrop-blur-xl"
                required
              />

              <button
                type="submit"
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white text-xl font-bold tracking-wide shadow-2xl shadow-purple-600/50 hover:scale-105 hover:shadow-purple-600/70 transform transition-all duration-300"
              >
                {isLogin ? "Enter the Matrix" : "Join the Revolution"}
              </button>

              {error && (
                <p className="text-red-400 text-center font-medium bg-red-500/10 py-3 rounded-xl border border-red-500/30">
                  {error}
                </p>
              )}

              <p className="text-center text-white/70">
                {isLogin ? "First time here? " : "Welcome back! "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-purple-400 hover:text-pink-400 underline-offset-4 hover:underline transition"
                >
                  {isLogin ? "Create Account" : "Login"}
                </button>
              </p>
            </form>

            {/* Subtle bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-600/20 to-transparent blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}