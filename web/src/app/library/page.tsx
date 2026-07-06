import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getPublishedBooks } from "@/lib/books";
import LibraryHome from "@/components/LibraryHome";
import AccountMenu from "@/components/AccountMenu";
import { pickGreetIndex } from "@/lib/greetings";
import ThemeToggle from "@/components/ThemeToggle";
import type { BookListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  // 태그 캐시된 공개 책 목록 — 관리자 변경 시 revalidateTag("books")로 즉시 갱신
  let books: BookListItem[] = [];
  try {
    books = await getPublishedBooks();
  } catch {
    books = [];
  }

  return (
    <>
      <div className="top-bar">
        <ThemeToggle />
        {session.userId ? (
          <AccountMenu
            isAdmin={session.isAdmin}
            greetIndex={pickGreetIndex()}
            profile={{
              id: session.userId,
              name: session.profile?.name ?? null,
              email: session.profile?.email ?? session.email ?? null,
              address: session.profile?.address ?? null,
              gender: session.profile?.gender ?? null,
              bio: session.profile?.bio ?? null,
              avatar_url: session.profile?.avatar_url ?? null,
            }}
          />
        ) : (
          <div className="top-actions">
            <Link className="pill-btn" href="/login">
              <svg className="auth-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <path d="m10 17 5-5-5-5" />
                <path d="M15 12H3" />
              </svg>
              로그인
            </Link>
            <Link className="pill-btn solid" href="/signup">
              <svg className="auth-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              회원가입
            </Link>
          </div>
        )}
      </div>

      <LibraryHome
        books={books}
        userId={session.userId}
        userName={session.profile?.name ?? null}
        userAvatarUrl={session.profile?.avatar_url ?? null}
        emailVerified={session.emailVerified}
        isAdmin={session.isAdmin}
      />
    </>
  );
}
