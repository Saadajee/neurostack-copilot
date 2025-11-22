// frontend/src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat.jsx";
import Analytics from "./pages/Analytics.jsx";
import Auth from "./components/Auth.jsx";
import { Toaster } from "react-hot-toast";
import "./index.css";

// Force dark mode from the very first render
document.documentElement.classList.add("dark");

// Simple token guards
const Protected = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" replace />;
};

const Public = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
};

// Safe Auth wrapper — onLogin will NEVER break
function AuthWrapper() {
  return (
    <Auth
      onLogin={(userData) => {
        localStorage.setItem("email", userData.email);
        window.location.href = "/"; // hard redirect = 100% safe
      }}
    />
  );
}

// Optional: Also force dark mode if user had it saved (fallback)
if (localStorage.getItem("email")) {
  const saved = localStorage.getItem(`darkmode_${localStorage.getItem("email")}`);
  if (saved === "false") {
    document.documentElement.classList.remove("dark");
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Public><AuthWrapper /></Public>} />
        <Route path="/" element={<Protected><Chat /></Protected>} />
        <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  </React.StrictMode>
);