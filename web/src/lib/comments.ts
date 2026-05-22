import type { CommentNode } from "./types";

export const COMMENT_SELECT =
  "id,book_id,parent_id,author_id,content,hidden,created_at, profiles(name)";

export type RawComment = {
  id: number;
  book_id: number;
  parent_id: number | null;
  author_id: string;
  content: string;
  hidden: boolean;
  created_at: string;
  profiles: { name: string | null } | null;
};

/** 평면 댓글 목록(작성순)을 부모-자식 트리로 조립. */
export function buildCommentTree(rows: RawComment[]): CommentNode[] {
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      book_id: r.book_id,
      parent_id: r.parent_id,
      author_id: r.author_id,
      author_name: r.profiles?.name || "익명",
      content: r.content,
      hidden: r.hidden,
      created_at: r.created_at,
      children: [],
    });
  }
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}
