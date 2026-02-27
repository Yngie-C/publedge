import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, apiSuccess } from "@/lib/api-utils";
import type { CollaboratorRole } from "@/types/social";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;

  const supabase = await createClient();

  // Verify user has access to this book (owner or collaborator)
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, owner_id")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }

  const isOwner = book.owner_id === user.id;
  if (!isOwner) {
    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .single();
    if (!collab) return apiError("Forbidden", "FORBIDDEN", 403);
  }

  const { data, error } = await supabase
    .from("collaborators")
    .select(
      `
      *,
      user_profile:user_profiles!user_id(display_name, avatar_url)
    `,
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess(data ?? []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;

  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  const { email, role } = body;

  if (!email || typeof email !== "string") {
    return apiError("email is required", "VALIDATION_ERROR", 400);
  }

  const validRoles: CollaboratorRole[] = ["editor", "viewer", "commenter"];
  const typedRole = (role as CollaboratorRole) ?? "editor";
  if (!validRoles.includes(typedRole)) {
    return apiError(
      "role must be one of: editor, viewer, commenter",
      "VALIDATION_ERROR",
      400,
    );
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, owner_id")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }
  if (book.owner_id !== user.id) {
    return apiError("Only book owners can invite collaborators", "FORBIDDEN", 403);
  }

  // Look up user by email via auth (using admin or user_profiles table with email)
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, display_name")
    .eq("email", email)
    .single();

  // If user_profiles doesn't have email column, fall back to auth.users lookup
  // We store a best-effort lookup; in production this would use an admin SDK
  if (profileError || !profileData) {
    return apiError(
      "User with that email not found",
      "NOT_FOUND",
      404,
    );
  }

  if (profileData.user_id === user.id) {
    return apiError("Cannot invite yourself", "VALIDATION_ERROR", 400);
  }

  const { data, error } = await supabase
    .from("collaborators")
    .insert({
      book_id: bookId,
      user_id: profileData.user_id,
      role: typedRole,
      invited_by: user.id,
      accepted: false,
    })
    .select(
      `
      *,
      user_profile:user_profiles!user_id(display_name, avatar_url)
    `,
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return apiError("User is already a collaborator", "VALIDATION_ERROR", 409);
    }
    return apiError(error.message, "SERVER_ERROR", 500);
  }

  return apiSuccess(data, 201);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const user = await getAuthUser();
  if (!user) return apiError("Authentication required", "UNAUTHORIZED", 401);

  const { bookId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return apiError("userId query parameter is required", "VALIDATION_ERROR", 400);
  }

  const supabase = await createClient();

  // Verify ownership
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, owner_id")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return apiError("Book not found", "NOT_FOUND", 404);
  }
  if (book.owner_id !== user.id) {
    return apiError(
      "Only book owners can remove collaborators",
      "FORBIDDEN",
      403,
    );
  }

  const { error } = await supabase
    .from("collaborators")
    .delete()
    .eq("book_id", bookId)
    .eq("user_id", userId);

  if (error) return apiError(error.message, "SERVER_ERROR", 500);

  return apiSuccess({ deleted: true });
}
