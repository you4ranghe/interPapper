import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) redirect("/");

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-brand">
          <Link href="/">Interpaper</Link>
          <span className="sep">·</span>
          <span className="label">서재관리</span>
        </div>
        <AdminNav />
        <div className="admin-user">
          <span className="who">{session.profile?.name || session.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
