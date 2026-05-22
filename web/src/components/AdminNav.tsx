"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: [string, string][] = [
  ["/admin/books", "책관리"],
  ["/admin/comments", "댓글관리"],
  ["/admin/members", "회원관리"],
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} className={`admin-tab${path.startsWith(href) ? " active" : ""}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
