export type Collection = {
  access: "owner" | "viewer";
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
};

export type CollectionInput = Pick<Collection, "name">;

export type CollectionScope = "owned" | "shared";

export type CollectionShare = {
  createdAt: string;
  email: string;
  id: string;
};
