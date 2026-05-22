import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import Coverflow from "@/components/Coverflow";
import LogoutButton from "@/components/LogoutButton";
import type { BookSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  let books: BookSummary[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("books")
      .select("id,title,cover_path")
      .order("created_at", { ascending: false });
    books = (data as BookSummary[]) ?? [];
  } catch {
    books = [];
  }

  return (
    <div className="hero">
      <div className="top-actions">
        {session.userId ? (
          <>
            <span className="pill-btn" style={{ pointerEvents: "none" }}>
              <span className="who">{session.profile?.name || session.email}</span>님
            </span>
            {session.isAdmin && (
              <Link className="pill-btn solid" href="/admin">서재관리</Link>
            )}
            <LogoutButton />
          </>
        ) : (
          <>
            <Link className="pill-btn" href="/login">로그인</Link>
            <Link className="pill-btn solid" href="/signup">회원가입</Link>
          </>
        )}
      </div>

      <header className="site-header">
        <p className="eyebrow">Interpaper Library</p>
        <h1>아버지의 서재</h1>
        <div className="divider" />
        <p>가운데 책을 클릭하면, 책 뒤의 이야기가 펼쳐집니다.</p>
      </header>

      <Coverflow books={books} />
    </div>
  );
}
