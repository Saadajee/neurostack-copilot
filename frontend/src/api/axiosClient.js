// frontend/src/api/axiosClient.js
import axios from "axios";

if (!import.meta.env.VITE_API_BASE) {
  throw new Error("VITE_API_BASE is not set! Check your .env file");
}

const API_BASE = import.meta.env.VITE_API_BASE;

const client = axios.create({
  baseURL: API_BASE,
  timeout: 90000,
  // DO NOT SET responseType here globally!
});

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
