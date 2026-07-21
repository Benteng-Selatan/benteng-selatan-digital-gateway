"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cms/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message || "Login gagal.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <span className="brand-mark"><LockKeyhole size={20} /></span>
      <h1>CMS Benteng Selatan</h1>
      <p>Masuk untuk mengelola konten publik dan operasional layanan warga.</p>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="username">Nama pengguna</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div>
        <div className="field"><label htmlFor="password">Kata sandi</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle size={18} className="loading-spin" /> : <LockKeyhole size={18} />} {loading ? "Memeriksa..." : "Masuk ke CMS"}</button>
      </form>
      <p className="login-note">Gunakan akun petugas yang dikonfigurasi melalui environment variable production.</p>
    </div>
  );
}
