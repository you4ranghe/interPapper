import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createSbClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { confirmMemberEmail } from "@/app/admin/actions";
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

async function getEmailConfirmedAt(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const admin = createSbClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return data.user.email_confirmed_at ?? null;
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

  const emailConfirmedAt = await getEmailConfirmedAt(id);
  const verified = Boolean(emailConfirmedAt);

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>회원 상세</h2>
        <Link className="btn ghost" href="/admin/members">← 목록</Link>
      </div>

      <div className="detail-grid">
        <Field label="성함" value={m.name || "-"} />
        <Field label="이메일" value={m.email || "-"} />
        <Field
          label="이메일 인증"
          valueNode={
            verified ? (
              <span className="badge on">인증 완료{emailConfirmedAt ? ` · ${fmt(emailConfirmedAt)}` : ""}</span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="badge off">미인증</span>
                <form action={confirmMemberEmail}>
                  <input type="hidden" name="userId" value={m.id} />
                  <button className="btn sm" type="submit">관리자 권한으로 인증 처리</button>
                </form>
              </div>
            )
          }
        />
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

function Field({ label, value, valueNode, wide }: { label: string; value?: string; valueNode?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`field-row${wide ? " wide" : ""}`}>
      <div className="field-label">{label}</div>
      <div className="field-value">{valueNode ?? value}</div>
    </div>
  );
}
