"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">비밀번호 찾기</p>
        <h1>비밀번호 재설정</h1>

        {sent ? (
          <div className="auth-sent">
            <p><b>{email}</b> 으로 재설정 메일을 보냈습니다.</p>
            <p className="muted">메일의 링크를 클릭하면 새 비밀번호를 설정할 수 있습니다.</p>
            <Link className="pill-btn solid" href="/login">로그인으로</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="auth-form">
            <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            {err && <p className="auth-err">{err}</p>}
            <button className="pill-btn solid" type="submit" disabled={loading}>
              {loading ? "보내는 중…" : "재설정 링크 받기"}
            </button>
            <p className="muted center">비밀번호가 기억나셨나요? <Link href="/login">로그인</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
