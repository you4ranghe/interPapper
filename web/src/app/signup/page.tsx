"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("na");
  const [bio, setBio] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email || !password || !name) {
      setErr("이메일, 비밀번호, 성함은 필수입니다.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, address, gender, bio },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
        <p className="eyebrow">Join Interpaper</p>
        <h1>회원가입</h1>

        {sent ? (
          <div className="auth-sent">
            <p><b>{email}</b> 으로 인증 메일을 보냈습니다.</p>
            <p className="muted">메일의 링크를 클릭해 인증을 마치면 댓글을 작성할 수 있습니다.</p>
            <Link className="pill-btn solid" href="/library">서재로</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="auth-form">
            <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
            <label>성함<input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label>주소<input type="text" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
            <label>성별
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="na">선택 안 함</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </label>
            <label>자기소개<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></label>
            {err && <p className="auth-err">{err}</p>}
            <button className="pill-btn solid" type="submit" disabled={loading}>
              {loading ? "처리 중…" : "가입하기"}
            </button>
            <p className="muted center">이미 회원이신가요? <Link href="/login">로그인</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
