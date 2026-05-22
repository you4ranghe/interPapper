"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/admin/actions";
import type { Book } from "@/lib/types";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Book;
  submitLabel: string;
};

export default function BookForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [preview, setPreview] = useState<string | null>(initial?.cover_path ?? null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <form action={formAction} className="admin-form">
      {initial && <input type="hidden" name="id" value={initial.id} />}

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
            <label>출간 연도<input type="number" name="published_year" defaultValue={initial?.published_year ?? ""} placeholder="2024" /></label>
          </div>
          <label>책 소개<textarea name="introduction" defaultValue={initial?.introduction ?? ""} rows={4} required /></label>
          <label>저자의 글<textarea name="author_note" defaultValue={initial?.author_note ?? ""} rows={3} /></label>
        </div>
      </div>

      {state.error && <p className="admin-err">{state.error}</p>}
      <div className="admin-form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "저장 중…" : submitLabel}</button>
      </div>
    </form>
  );
}
