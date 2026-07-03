"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markCommentRead } from "@/app/actions/notifications";
import Avatar from "@/components/Avatar";
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
  userAvatarUrl?: string | null;
  emailVerified: boolean;
  isAdmin?: boolean;
  highlightId?: number | null;
  onChanged?: () => void | Promise<void>;
};

/** 낙관적 댓글(임시 id<0)을 트리의 알맞은 위치(루트 또는 부모의 children)에 끼워 넣는다. */
function insertNode(tree: CommentNode[], node: CommentNode): CommentNode[] {
  if (node.parent_id == null) return [...tree, node];
  return tree.map((n) =>
    n.id === node.parent_id
      ? { ...n, children: [...n.children, node] }
      : { ...n, children: insertNode(n.children, node) }
  );
}

export default function Discussion({
  bookId, comments, userId, userName, userAvatarUrl = null, emailVerified, isAdmin = false, highlightId = null, onChanged,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const canComment = Boolean(userId && emailVerified);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  // 낙관적 댓글: 서버 확정 전에 내 댓글을 즉시 트리에 표시 (React 19 useOptimistic)
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state: CommentNode[], node: CommentNode) => insertNode(state, node)
  );

  useEffect(() => {
    if (highlightId != null && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, comments]);

  function submit(content: string, parentId: number | null): Promise<string | null> {
    if (!userId) return Promise.resolve("로그인이 필요합니다.");
    // transition 안에서 낙관적 노드를 추가하고, 실제 목록 갱신이 끝날 때까지 유지한다.
    return new Promise((resolve) => {
      startTransition(async () => {
        addOptimisticComment({
          id: -Date.now(), // 임시 음수 id — 서버 확정 데이터로 교체됨
          book_id: bookId,
          parent_id: parentId,
          author_id: userId,
          author_name: userName ?? "나",
          author_avatar_url: userAvatarUrl,
          content,
          hidden: false,
          created_at: new Date().toISOString(),
          edited_at: null,
          children: [],
        });
        try {
          const { error } = await supabase.from("comments").insert({
            book_id: bookId,
            parent_id: parentId,
            author_id: userId,
            content,
          });
          if (error) {
            console.error("[Discussion] comment insert failed:", error);
            resolve(error.message || "댓글 등록에 실패했습니다.");
            return;
          }
          // 관리자가 답글을 달면 해당 부모 댓글은 자동으로 읽음 처리.
          if (isAdmin && parentId != null) {
            try { await markCommentRead(parentId); } catch (e) { console.warn("[Discussion] markCommentRead skipped:", e); }
          }
          setReplyTo(null);
          if (onChanged) await onChanged();
          else router.refresh();
          resolve(null);
        } catch (e) {
          console.error("[Discussion] submit threw:", e);
          resolve(e instanceof Error ? e.message : "댓글 등록 중 오류가 발생했습니다.");
        }
      });
    });
  }

  // 본인 댓글 수정 — 안전한 RPC(content/edited_at 만 변경)
  async function editComment(id: number, content: string): Promise<string | null> {
    try {
      const { error } = await supabase.rpc("edit_own_comment", { p_id: id, p_content: content });
      if (error) {
        console.error("[Discussion] comment edit failed:", error);
        return error.message || "수정에 실패했습니다.";
      }
      setEditingId(null);
      if (onChanged) onChanged();
      else router.refresh();
      return null;
    } catch (e) {
      console.error("[Discussion] edit threw:", e);
      return e instanceof Error ? e.message : "수정 중 오류가 발생했습니다.";
    }
  }

  return (
    <div className="discussion">
      <div className="comment-tree">
        {optimisticComments.length === 0 ? (
          <p className="empty">아직 댓글이 없습니다. 첫 감상을 남겨보세요.</p>
        ) : (
          optimisticComments.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              userId={userId}
              canComment={canComment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              editingId={editingId}
              setEditingId={setEditingId}
              onSubmit={submit}
              onEdit={editComment}
              highlightId={highlightId}
              highlightRef={highlightRef}
            />
          ))
        )}
      </div>

      <div className="root-form-wrap">
        {canComment ? (
          <CommentForm
            label={`${userName ?? "회원"}님으로 작성`}
            avatarSrc={userAvatarUrl}
            avatarName={userName}
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
  node, userId, canComment, replyTo, setReplyTo, editingId, setEditingId, onSubmit, onEdit, highlightId, highlightRef,
}: {
  node: CommentNode;
  userId: string | null;
  canComment: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  onSubmit: (content: string, parentId: number | null) => Promise<string | null>;
  onEdit: (id: number, content: string) => Promise<string | null>;
  highlightId: number | null;
  highlightRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isAuthorBadge = node.author_name === "저자";
  const isHighlighted = highlightId === node.id;
  const isOwn = userId != null && node.author_id === userId && !node.hidden;
  const isEditing = editingId === node.id;
  return (
    <div
      className={`comment${isHighlighted ? " is-highlight" : ""}${node.id < 0 ? " is-pending" : ""}`}
      ref={isHighlighted ? highlightRef : undefined}
      id={`comment-${node.id}`}
    >
      <div className="c-row">
        <Avatar
          src={node.author_avatar_url}
          name={node.author_name}
          size={40}
          className="c-avatar"
        />
        <div className="c-main">
          <div className="c-head">
            <span className={`c-nick${isAuthorBadge ? " author" : ""}`}>{node.author_name}</span>
            <span className="c-time">{formatKST(node.created_at)}</span>
            {node.edited_at && (
              <span className="c-edited" title={`편집 ${formatKST(node.edited_at)}`}>편집함 · {formatKST(node.edited_at)}</span>
            )}
            {node.hidden && <span className="c-hidden">숨김</span>}
          </div>
          {isEditing ? (
            <CommentForm
              label="댓글 수정"
              compact
              initial={node.content}
              submitLabel="수정"
              onCancel={() => setEditingId(null)}
              onSubmit={(content) => onEdit(node.id, content)}
            />
          ) : (
            <div className="c-body">{node.content}</div>
          )}
          {!isEditing && (
            <div className="c-actions">
              {canComment && (
                <button className="c-reply-btn" type="button" onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}>
                  ↳ 답글
                </button>
              )}
              {isOwn && (
                <button className="c-edit-btn" type="button" onClick={() => { setReplyTo(null); setEditingId(node.id); }}>
                  ✎ 수정
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {replyTo === node.id && !isEditing && (
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
              userId={userId}
              canComment={canComment}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              editingId={editingId}
              setEditingId={setEditingId}
              onSubmit={onSubmit}
              onEdit={onEdit}
              highlightId={highlightId}
              highlightRef={highlightRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  label, compact, initial, submitLabel, avatarSrc, avatarName, onCancel, onSubmit,
}: {
  label: string;
  compact?: boolean;
  initial?: string;
  submitLabel?: string;
  avatarSrc?: string | null;
  avatarName?: string | null;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<string | null>;
}) {
  const [content, setContent] = useState(initial ?? "");
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
    else if (initial === undefined) setContent("");
  }

  const showAvatar = avatarSrc !== undefined || avatarName !== undefined;

  return (
    <form className={`comment-form${compact ? " compact" : ""}${showAvatar ? " with-avatar" : ""}`} onSubmit={handle}>
      {showAvatar && <Avatar src={avatarSrc} name={avatarName} size={40} className="cf-avatar" />}
      <div className="cf-body">
        <div className="cf-label">{label}</div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={compact ? 2 : 3} placeholder="감상을 남겨주세요…" />
        <div className="form-actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? "처리 중…" : (submitLabel ?? "등록")}</button>
          {onCancel && <button className="btn secondary" type="button" onClick={onCancel}>취소</button>}
          {err && <span className="form-error">{err}</span>}
        </div>
      </div>
    </form>
  );
}
