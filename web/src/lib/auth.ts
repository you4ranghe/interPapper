// 현재 로그인 사용자 + profile 조회 (서버 컴포넌트/라우트용)
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type SessionInfo = {
  userId: string | null;
  email: string | null;
  emailVerified: boolean;
  profile: Profile | null;
  isAdmin: boolean;
};

export async function getSession(): Promise<SessionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, emailVerified: false, profile: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    profile: (profile as Profile) ?? null,
    isAdmin: (profile as Profile)?.role === "admin",
  };
}
