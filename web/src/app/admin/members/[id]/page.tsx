import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<string, string> = { male: "남성", female: "여성", other: "기타", na: "미지정" };

function fmt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));
  } catch { return iso; }
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const m = data as Profile;

  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", id);

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>회원 상세</h2>
        <Link className="btn ghost" href="/admin/members">← 목록</Link>
      </div>

      <div className="detail-grid">
        <Field label="성함" value={m.name || "-"} />
        <Field label="이메일" value={m.email || "-"} />
        <Field label="성별" value={GENDER_LABEL[m.gender ?? "na"] ?? "-"} />
        <Field label="권한" value={m.role === "admin" ? "관리자" : "회원"} />
        <Field label="주소" value={m.address || "-"} />
        <Field label="가입일" value={fmt(m.created_at)} />
        <Field label="작성 댓글 수" value={String(count ?? 0)} />
        <Field label="자기소개" value={m.bio || "-"} wide />
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`field-row${wide ? " wide" : ""}`}>
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}
