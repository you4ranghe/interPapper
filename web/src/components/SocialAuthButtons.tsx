"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 구글 소셜 로그인 — 성공 시 브라우저가 구글로 이동하고,
// 인증 후 /auth/callback 이 code 를 세션으로 교환한 뒤 next 로 리다이렉트한다.
export default function SocialAuthButtons({ next = "/library" }: { next?: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function signIn() {
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // 성공하면 리다이렉트되므로 이 아래는 실패했을 때만 도달
    if (error) {
      setLoading(false);
      setErr(error.message);
    }
  }

  return (
    <div className="social-auth">
      <div className="social-divider"><span>또는</span></div>
      <button
        type="button"
        className="social-btn google"
        onClick={signIn}
        disabled={loading}
      >
        <GoogleIcon />
        <span>{loading ? "이동 중…" : "Google로 계속하기"}</span>
      </button>
      {err && <p className="auth-err">{err}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="social-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M23.06 12.25c0-.86-.08-1.68-.22-2.47H12v4.68h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.59Z" />
      <path fill="#34A853" d="M12 24c3.11 0 5.72-1.03 7.62-2.79l-3.72-2.9c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.45-4.76H1.7v2.99A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.55 14.65a7.2 7.2 0 0 1 0-4.6V7.06H1.7a12 12 0 0 0 0 10.58l3.85-2.99Z" />
      <path fill="#EA4335" d="M12 4.75c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.72 1.2 15.11 0 12 0A11.99 11.99 0 0 0 1.7 6.06l3.85 2.99C6.46 6.78 9 4.75 12 4.75Z" />
    </svg>
  );
}
