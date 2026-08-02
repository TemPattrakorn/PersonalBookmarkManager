export type Collection = {
  access: "owner" | "viewer";
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
};

export type CollectionInput = Pick<Collection, "name">;
