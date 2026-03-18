export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  // joined
  user_profile?: { display_name: string; avatar_url: string | null };
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type CollaboratorRole = "editor" | "viewer" | "commenter";

export interface Collaborator {
  id: string;
  book_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  accepted: boolean;
  created_at: string;
  user_profile?: { display_name: string; avatar_url: string | null };
}
