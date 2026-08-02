export type Bookmark = {
  access: "owner" | "viewer";
  collectionId: string | null;
  createdAt: string;
  id: string;
  notes: string | null;
  title: string;
  updatedAt: string;
  url: string;
};

export type BookmarkInput = Pick<Bookmark, "collectionId" | "notes" | "title" | "url">;
