"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

export function CitizenAuthForm({ mode }: { mode: "login" | "register" }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/citizen/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Proses gagal.");
      window.location.href = "/warga";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Proses gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="portal-form">
      {mode === "register" ? <>
        <div className="field"><label>Nama lengkap</label><input name="fullName" required minLength={3} maxLength={120} /></div>
        <div className="field"><label>Nomor WhatsApp</label><input name="phone" required minLength={8} maxLength={30} inputMode="tel" /></div>
        <div className="field"><label>Alamat domisili</label><textarea name="address" required minLength={10} maxLength={500} rows={3} /></div>
      </> : null}
      <div className="field"><label>Email</label><input name="email" type="email" required autoComplete="email" maxLength={180} /></div>
      <div className="field"><label>Kata sandi</label><input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
      {message ? <p className="error-text">{message}</p> : null}
      <button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="loading-spin" size={17} /> Memproses...</> : mode === "login" ? "Masuk" : "Buat akun"}</button>
      <p className="auth-switch">{mode === "login" ? <>Belum memiliki akun? <Link href="/warga/daftar">Daftar sebagai warga</Link></> : <>Sudah memiliki akun? <Link href="/warga/masuk">Masuk</Link></>}</p>
    </form>
  );
}
