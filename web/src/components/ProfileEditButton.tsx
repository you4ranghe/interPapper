"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileLite = {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  gender: string | null;
  bio: string | null;
};

const GENDERS: { value: string; label: string }[] = [
  { value: "na", label: "미지정" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
];

export default function ProfileEditButton({ profile }: { profile: ProfileLite }) {
  const [open, setOpen] = useState(false);
  const display = profile.name || profile.email || "회원";
  return (
    <>
      <button
        type="button"
        className="pill-btn who-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title="회원정보 수정"
      >
        <svg className="who-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="who-desktop"><span className="who">{display}</span>님</span>
        <span className="who-mobile">마이페이지</span>
      </button>
      {open && createPortal(
        <ProfileModal profile={profile} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

function ProfileModal({ profile, onClose }: { profile: ProfileLite; onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(profile.name ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [gender, setGender] = useState<string>(profile.gender ?? "na");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const trimmedName = name.trim();
    if (!trimmedName) { setErr("성함을 입력하세요."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: trimmedName,
        address: address.trim() || null,
        gender,
        bio: bio.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setErr(error.message || "저장에 실패했습니다.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="profile-modal-root" role="dialog" aria-modal="true" aria-label="회원정보 수정">
      <button type="button" className="profile-backdrop" aria-label="닫기" onClick={onClose} />
      <div className="profile-modal">
        <div className="profile-head">
          <h3>회원정보 수정</h3>
          <button type="button" className="profile-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <form className="profile-form" onSubmit={handleSave}>
          <label>
            성함
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </label>
          <label>
            이메일
            <input value={profile.email ?? ""} disabled />
          </label>
          <label>
            성별
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
          <label>
            주소
            <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
          </label>
          <label>
            자기소개
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} />
          </label>
          {err && <p className="profile-err">{err}</p>}
          <div className="profile-actions">
            <button type="submit" className="btn" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
            <button type="button" className="btn secondary" onClick={onClose}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
}
