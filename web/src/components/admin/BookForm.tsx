"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import type { Book, PurchaseLink } from "@/lib/types";
import YearPicker from "@/components/admin/YearPicker";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Book;
  submitLabel: string;
};

const SELLER_PRESETS = ["교보문고", "알라딘", "예스24"];

export default function BookForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [preview, setPreview] = useState<string | null>(initial?.cover_path ?? null);
  const [published, setPublished] = useState<boolean>(initial?.is_published ?? true);
  const [links, setLinks] = useState<PurchaseLink[]>(initial?.purchase_links ?? []);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  const addLink = () => setLinks((prev) => [...prev, { seller: SELLER_PRESETS[0], url: "" }]);
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const updateLink = (i: number, patch: Partial<PurchaseLink>) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // url 없는 항목은 서버에서도 걸러지지만, 직렬화 단계에서도 제거
  const linksJson = JSON.stringify(links.filter((l) => l.url.trim()));

  return (
    <form action={formAction} className="admin-form">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {/* 판매처 링크는 JSON 문자열로 전송 */}
      <input type="hidden" name="purchase_links" value={linksJson} />
      {published && <input type="hidden" name="is_published" value="1" />}

      <div className="admin-form-grid">
        <div className="cover-field">
          <div className="cover-preview">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="표지 미리보기" />
            ) : (
              <span className="ph">표지 이미지</span>
            )}
          </div>
          <label className="file-btn">
            {initial ? "표지 변경" : "표지 선택"}
            <input type="file" name="cover" accept="image/*" onChange={onPick} required={!initial} />
          </label>
        </div>

        <div className="fields">
          <label>제목<input type="text" name="title" defaultValue={initial?.title ?? ""} maxLength={200} required /></label>
          <div className="two">
            <label>책 타입<input type="text" name="book_type" defaultValue={initial?.book_type ?? ""} placeholder="에세이 / 산문 / 회고" /></label>
            <label>출간 연도<YearPicker name="published_year" initial={initial?.published_year ?? null} /></label>
          </div>

          {/* 출간 여부 */}
          <button
            type="button"
            className={`pub-toggle${published ? " on" : ""}`}
            role="switch"
            aria-checked={published}
            onClick={() => setPublished((v) => !v)}
          >
            <span className="dot" aria-hidden />
            <span className="txt">{published ? "출간 완료" : "미출간 (출간 예정)"}</span>
          </button>

          <label>책 소개<textarea name="introduction" defaultValue={initial?.introduction ?? ""} rows={10} required /></label>
          <label>저자의 글<textarea name="author_note" defaultValue={initial?.author_note ?? ""} rows={6} /></label>

          {/* 판매처 링크 (관리자 전용) */}
          <div className="links-field">
            <div className="links-head">
              <span className="lbl">판매처 링크</span>
              <span className="hint">관리자 화면에서만 보입니다</span>
            </div>

            {links.length === 0 ? (
              <p className="links-empty">등록된 판매처가 없습니다.</p>
            ) : (
              <div className="links-list">
                {links.map((l, i) => (
                  <div className="link-row" key={i}>
                    <input
                      className="seller"
                      type="text"
                      list="seller-presets"
                      value={l.seller}
                      placeholder="판매처"
                      onChange={(e) => updateLink(i, { seller: e.target.value })}
                    />
                    <input
                      className="url"
                      type="url"
                      value={l.url}
                      placeholder="https://..."
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                    />
                    {l.url.trim() ? (
                      <a
                        className="link-open"
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="새 탭에서 열기"
                      >
                        열기 ↗
                      </a>
                    ) : (
                      <span className="link-open is-disabled" aria-disabled>열기 ↗</span>
                    )}
                    <button type="button" className="link-del" onClick={() => removeLink(i)} aria-label="삭제">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <datalist id="seller-presets">
              {SELLER_PRESETS.map((s) => <option key={s} value={s} />)}
            </datalist>

            <button type="button" className="btn ghost link-add" onClick={addLink}>+ 판매처 추가</button>
          </div>
        </div>
      </div>

      {state.error && <p className="admin-err">{state.error}</p>}
      <div className="admin-form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "저장 중…" : submitLabel}</button>
      </div>
    </form>
  );
}
