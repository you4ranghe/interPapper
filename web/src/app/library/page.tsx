import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import LibraryHome from "@/components/LibraryHome";
import LogoutButton from "@/components/LogoutButton";
import AdminNotifications from "@/components/AdminNotifications";
import ProfileEditButton from "@/components/ProfileEditButton";
import type { BookListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  let books: BookListItem[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("books")
      .select("id,title,cover_path,book_type,introduction")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    books = (data as BookListItem[]) ?? [];
  } catch {
    books = [];
  }

  return (
    <>
      <div className="top-bar">
        {session.userId && session.isAdmin && (
          <div className="admin-actions">
            <Link className="pill-btn home-btn" href="/admin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 7v14" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
              </svg>
              서재 관리페이지
            </Link>
            <AdminNotifications />
          </div>
        )}
        <div className="top-actions">
          {session.userId ? (
            <>
              <ProfileEditButton
                profile={{
                  id: session.userId,
                  name: session.profile?.name ?? null,
                  email: session.profile?.email ?? session.email ?? null,
                  address: session.profile?.address ?? null,
                  gender: session.profile?.gender ?? null,
                  bio: session.profile?.bio ?? null,
                }}
              />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="pill-btn" href="/login">로그인</Link>
              <Link className="pill-btn solid" href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>

      <LibraryHome
        books={books}
        userId={session.userId}
        userName={session.profile?.name ?? null}
        emailVerified={session.emailVerified}
        isAdmin={session.isAdmin}
      />
    </>
  );
}
