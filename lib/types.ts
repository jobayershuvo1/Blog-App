/** Plain (serialized) shapes passed from Server Components to the client. */

export interface AuthorLite {
  _id: string;
  name: string;
  username?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

export interface CategoryLite {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
}

export interface PostCardData {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string | null;
  tags: string[];
  views: number;
  readingTime: number;
  publishedAt: string | null;
  author: AuthorLite | null;
  category: CategoryLite | null;
}
