import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = { q?: string; gender?: string; role?: string };

const GENDER_LABEL: Record<string, string> = { male: "남성", female: "여성", other: "기타", na: "미지정" };

function fmt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (sp.q) {
    const safe = sp.q.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (sp.gender) query = query.eq("gender", sp.gender);
  if (sp.role) query = query.eq("role", sp.role);

  const { data } = await query;
  const members = (data as Profile[]) ?? [];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>회원관리 <span className="cnt">{members.length}</span></h2>
      </div>

      <form className="filter-bar" method="get">
        <input type="text" name="q" placeholder="이름 / 이메일 검색" defaultValue={sp.q ?? ""} />
        <select name="gender" defaultValue={sp.gender ?? ""}>
          <option value="">전체 성별</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
          <option value="na">미지정</option>
        </select>
        <select name="role" defaultValue={sp.role ?? ""}>
          <option value="">전체 권한</option>
          <option value="member">회원</option>
          <option value="admin">관리자</option>
        </select>
        <button className="btn" type="submit">검색</button>
        <Link className="btn ghost" href="/admin/members">초기화</Link>
      </form>

      {members.length === 0 ? (
        <p className="admin-empty">조건에 맞는 회원이 없습니다.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>성함</th><th>이메일</th><th>성별</th><th>권한</th><th>가입일</th><th></th></tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name || "-"}</td>
                <td>{m.email || "-"}</td>
                <td>{GENDER_LABEL[m.gender ?? "na"] ?? "-"}</td>
                <td>{m.role === "admin" ? <span className="badge gold">관리자</span> : "회원"}</td>
                <td className="nowrap">{fmt(m.created_at)}</td>
                <td><Link className="btn ghost sm" href={`/admin/members/${m.id}`}>상세</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
