"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/library");
    router.refresh();
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">어서오세요 반갑습니다.</p>
        <h1>로그인</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {err && <p className="auth-err">{err}</p>}
          <button className="pill-btn solid" type="submit" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </button>
          <SocialAuthButtons next="/library" />
          <p className="muted center"><Link href="/forgot-password">비밀번호를 잊으셨나요?</Link></p>
          <p className="muted center">아직 회원이 아니신가요? <Link href="/signup">회원가입</Link></p>
        </form>
      </div>
    </main>
  );
}
