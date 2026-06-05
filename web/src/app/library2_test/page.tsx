import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import Library2 from "./Library2";
import type { BookSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Library2TestPage() {
  const session = await getSession();

  let books: BookSummary[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("books")
      .select("id,title,cover_path,book_type")
      .order("created_at", { ascending: false });
    books = (data as BookSummary[]) ?? [];
  } catch {
    books = [];
  }

  return (
    <Library2
      books={books}
      userId={session.userId}
      userName={session.profile?.name ?? null}
      userDisplay={session.profile?.name || session.email || null}
      emailVerified={session.emailVerified}
      isAdmin={session.isAdmin}
    />
  );
}
