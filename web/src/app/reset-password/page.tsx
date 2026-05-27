"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setHasSession(!!data.user);
      if (!data.user) {
        setErr("재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해 주세요.");
      }
    });
    return () => { alive = false; };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 6) {
      setErr("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setErr("두 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/library");
      router.refresh();
    }, 1400);
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <p className="eyebrow">비밀번호 재설정</p>
        <h1>새 비밀번호</h1>

        {done ? (
          <div className="auth-sent">
            <p>비밀번호가 변경되었습니다.</p>
            <p className="muted">잠시 후 서재로 이동합니다…</p>
          </div>
        ) : hasSession === false ? (
          <div className="auth-sent">
            {err && <p className="auth-err">{err}</p>}
            <Link className="pill-btn solid" href="/forgot-password">재설정 링크 다시 받기</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="auth-form">
            <label>새 비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" /></label>
            <label>비밀번호 확인<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required autoComplete="new-password" /></label>
            {err && <p className="auth-err">{err}</p>}
            <button className="pill-btn solid" type="submit" disabled={loading || hasSession === null}>
              {loading ? "변경 중…" : "비밀번호 변경"}
            </button>
            <p className="muted center"><Link href="/login">로그인으로 돌아가기</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
