import React, { useState } from "react";
import client from "../api/axiosClient";

export default function Signup({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await client.post("/auth/signup", { username, password });
      localStorage.setItem("ns_token", res.data.access_token);
      onSuccess && onSuccess();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Signup failed");
    }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <h3>Signup</h3>
      <div style={{ marginBottom: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" required />
      </div>
      <button type="submit">Create account</button>
      {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
    </form>
  );
}
