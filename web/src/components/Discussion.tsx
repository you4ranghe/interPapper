"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CommentNode } from "@/lib/types";

function formatKST(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type Props = {
  bookId: number;
  comments: CommentNode[];
  userId: string | null;
  userName: string | null;
  emailVerified: boolean;
  onChanged?: () => void;
};

export default function Discussion({ bookId, comments, userId, userName, emailVerified, onChanged }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const canComment = Boolean(userId && emailVerified);

  async function submit(content: string, parentId: number | null): Promise<string | null> {
    if (!userId) return "로그인이 필요합니다.";
    const { error } = await supabase.from("comments").insert({
      book_id: bookId,
      parent_id: parentId,
      author_id: userId,
      content,
    });
    if (error) return error.message;
    setReplyTo(null);
    if (onChanged) onChanged();
    else router.refresh();
    return null;
  }

  return (
    <div className="discussion">
      <div className="comment-tree">
        {comments.length === 0 ? (
          <p className="empty">아직 댓글이 없습니다. 첫 감상을 남겨보세요.</p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              canComment={canComment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onSubmit={submit}
            />
          ))
        )}
      </div>

      <div className="root-form-wrap">
        {canComment ? (
          <CommentForm
            label={`${userName ?? "회원"}님으로 작성`}
            onSubmit={(content) => submit(content, null)}
          />
        ) : userId ? (
          <p className="gate">
            이메일 인증을 완료하면 댓글을 작성할 수 있습니다. 받은 편지함의 인증 메일을 확인해 주세요.
          </p>
        ) : (
          <p className="gate">
            댓글은 회원만 작성할 수 있습니다.{" "}
            <Link href="/login">로그인</Link> 또는 <Link href="/signup">회원가입</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  node, canComment, replyTo, setReplyTo, onSubmit,
}: {
  node: CommentNode;
  canComment: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  onSubmit: (content: string, parentId: number | null) => Promise<string | null>;
}) {
  const isAuthorBadge = node.author_name === "저자";
  return (
    <div className="comment">
      <div className="c-head">
        <span className={`c-nick${isAuthorBadge ? " author" : ""}`}>{node.author_name}</span>
        <span className="c-time">{formatKST(node.created_at)}</span>
        {node.hidden && <span className="c-hidden">숨김</span>}
      </div>
      <div className="c-body">{node.content}</div>
      {canComment && (
        <button className="c-reply-btn" type="button" onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}>
          ↳ 답글
        </button>
      )}
      {replyTo === node.id && (
        <div className="reply-form-wrap">
          <CommentForm
            label="답글 작성"
            compact
            onCancel={() => setReplyTo(null)}
            onSubmit={(content) => onSubmit(content, node.id)}
          />
        </div>
      )}
      {node.children.length > 0 && (
        <div className="children">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              canComment={canComment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  label, compact, onCancel, onSubmit,
}: {
  label: string;
  compact?: boolean;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<string | null>;
}) {
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const trimmed = content.trim();
    if (!trimmed) { setErr("내용을 입력하세요."); return; }
    setLoading(true);
    const error = await onSubmit(trimmed);
    setLoading(false);
    if (error) setErr(error);
    else setContent("");
  }

  return (
    <form className={`comment-form${compact ? " compact" : ""}`} onSubmit={handle}>
      <div className="cf-label">{label}</div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={compact ? 2 : 3} placeholder="감상을 남겨주세요…" />
      <div className="form-actions">
        <button className="btn" type="submit" disabled={loading}>{loading ? "등록 중…" : "등록"}</button>
        {onCancel && <button className="btn secondary" type="button" onClick={onCancel}>취소</button>}
        {err && <span className="form-error">{err}</span>}
      </div>
    </form>
  );
}
