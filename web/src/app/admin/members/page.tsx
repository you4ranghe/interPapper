import Link from "next/link";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import Pagination from "@/components/admin/Pagination";
import ClickableRow from "@/components/admin/ClickableRow";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SP = { q?: string; gender?: string; role?: string; page?: string };

const GENDER_LABEL: Record<string, string> = { male: "남성", female: "여성", other: "기타", na: "미지정" };

async function fetchVerifiedMap(ids: string[]): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  if (ids.length === 0) return out;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return out;
  const admin = createSbClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const idSet = new Set(ids);
  // listUsers는 페이지네이션. 회원 수가 많지 않다는 가정으로 첫 1~2 페이지만 훑기.
  for (let page = 1; page <= 3; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users || data.users.length === 0) break;
    for (const u of data.users) {
      if (idSet.has(u.id)) out.set(u.id, Boolean(u.email_confirmed_at));
    }
    if (data.users.length < 1000) break;
  }
  return out;
}

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

  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.q) {
    const safe = sp.q.replace(/[%,]/g, "");
    query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (sp.gender) query = query.eq("gender", sp.gender);
  if (sp.role) query = query.eq("role", sp.role);

  const { data, count } = await query.range(from, to);
  const members = (data as Profile[]) ?? [];
  const total = count ?? 0;

  const verifiedMap = await fetchVerifiedMap(members.map((m) => m.id));

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>회원관리 <span className="cnt">{total}</span></h2>
      </div>

      <form key={`${sp.q ?? ""}|${sp.gender ?? ""}|${sp.role ?? ""}`} className="filter-bar" method="get">
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
        <>
          <table className="admin-table">
            <thead>
              <tr><th>성함</th><th>이메일</th><th>인증</th><th>성별</th><th>권한</th><th>가입일</th></tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const verified = verifiedMap.get(m.id);
                return (
                  <ClickableRow key={m.id} href={`/admin/members/${m.id}`}>
                    <td>{m.name || "-"}</td>
                    <td>{m.email || "-"}</td>
                    <td>{verified === undefined ? "-" : verified ? <span className="badge on">인증</span> : <span className="badge off">미인증</span>}</td>
                    <td>{GENDER_LABEL[m.gender ?? "na"] ?? "-"}</td>
                    <td>{m.role === "admin" ? <span className="badge gold">관리자</span> : "회원"}</td>
                    <td className="nowrap">{fmt(m.created_at)}</td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </table>
          <Pagination
            basePath="/admin/members"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            params={{ q: sp.q, gender: sp.gender, role: sp.role }}
          />
        </>
      )}
    </div>
  );
}
