// frontend/src/api/axiosClient.js
import axios from "axios";

const isDev = import.meta.env.DEV;

const client = axios.create({
  // LOCAL DEV → uses your Vite proxy (so you can keep the proxy in vite.config.js)
  // PRODUCTION (Vercel) → hits your live HF Space directly
  baseURL: isDev
    ? "http://127.0.0.1:8000"                                 // ← dev (uses proxy below)
    : "https://saadajee-neurostack-copilot.hf.space",       // ← PRODUCTION (live)
  timeout: 30000,
});

// Auto-add Bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
