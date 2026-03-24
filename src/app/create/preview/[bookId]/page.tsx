import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreviewClient } from "./PreviewClient";

interface Props {
  params: Promise<{ bookId: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { bookId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: book } = await supabase
    .from("books")
    .select("id, title, owner_id")
    .eq("id", bookId)
    .single();

  if (!book || book.owner_id !== user.id) {
    redirect("/creator");
  }

  return <PreviewClient bookId={bookId} bookTitle={book.title} />;
}
