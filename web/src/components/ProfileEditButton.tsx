"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type ProfileLite = {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  gender: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url ?? null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 로컬 미리보기용 objectURL 정리
  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("이미지 파일만 등록할 수 있습니다."); return; }
    if (file.size > MAX_AVATAR_BYTES) { setErr("이미지는 5MB 이하만 등록할 수 있습니다."); return; }
    setErr("");
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setAvatarFile(file);
    setPreview(url);
  }

  function removeAvatar() {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    setAvatarFile(null);
    setPreview(null);
    setAvatarUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const trimmedName = name.trim();
    if (!trimmedName) { setErr("성함을 입력하세요."); return; }
    setSaving(true);

    // 새 이미지를 골랐으면 avatars 버킷에 업로드하고 공개 URL 획득
    let nextAvatarUrl = avatarUrl;
    if (avatarFile) {
      const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (upErr) {
        setSaving(false);
        setErr(upErr.message || "이미지 업로드에 실패했습니다.");
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      nextAvatarUrl = pub.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: trimmedName,
        address: address.trim() || null,
        gender,
        bio: bio.trim() || null,
        avatar_url: nextAvatarUrl,
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
          <div className="profile-avatar-field">
            <Avatar src={preview} name={name || profile.email} size={92} className="profile-avatar-preview" />
            <div className="profile-avatar-actions">
              <button type="button" className="btn secondary sm" onClick={() => fileRef.current?.click()}>
                {preview ? "이미지 변경" : "이미지 등록"}
              </button>
              {preview && (
                <button type="button" className="profile-avatar-remove" onClick={removeAvatar}>
                  제거
                </button>
              )}
              <p className="profile-avatar-hint">JPG·PNG, 5MB 이하</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              hidden
            />
          </div>
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
