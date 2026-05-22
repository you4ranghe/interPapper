export type Book = {
  id: number;
  title: string;
  introduction: string;
  author_note: string;
  cover_path: string | null;
  book_type: string | null;
  published_year: number | null;
  created_at: string;
};

export type BookSummary = Pick<Book, "id" | "title" | "cover_path">;

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  address: string | null;
  gender: "male" | "female" | "other" | "na" | null;
  bio: string | null;
  role: "member" | "admin";
  created_at: string;
};

export type CommentNode = {
  id: number;
  book_id: number;
  parent_id: number | null;
  author_id: string;
  author_name: string;
  content: string;
  hidden: boolean;
  created_at: string;
  children: CommentNode[];
};
