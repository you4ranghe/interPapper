import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import TopBarMenu from "@/components/TopBarMenu";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) redirect("/library");

  return (
    <div className="admin">
      <header className="admin-header">
        <span className="admin-title-m">서재관리</span>
        <TopBarMenu>
          <Link className="btn ghost admin-home-btn" href="/library">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
            서재로 이동
          </Link>
          <AdminNav />
          <div className="admin-user">
            <ThemeToggle />
            <span className="who">{session.profile?.name || session.email}</span>
            <LogoutButton />
          </div>
        </TopBarMenu>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
