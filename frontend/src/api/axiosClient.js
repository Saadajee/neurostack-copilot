// frontend/src/api/axiosClient.js
import axios from "axios";

const isDev = import.meta.env.DEV;

const client = axios.create({
  // In development: hit your local FastAPI backend
  // In HF Spaces production: use relative URL → same domain (automatically port 7860)
  baseURL: isDev ? "http://localhost:8000" : "", // ← empty string = relative URLs in production
  timeout: 60000,
});

// Auto-add JWT token if present
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
