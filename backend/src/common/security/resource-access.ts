import type { Prisma } from "../../generated/prisma/client";

export function ownedCollectionWhere(personId: string, id?: string): Prisma.CollectionWhereInput {
  return { ...(id ? { id } : {}), ownerId: personId };
}

export function accessibleCollectionWhere(
  personId: string,
  id?: string,
): Prisma.CollectionWhereInput {
  return {
    ...(id ? { id } : {}),
    OR: [
      { ownerId: personId },
      { shares: { some: { granteePersonId: personId } } },
    ],
  };
}

export function accessibleBookmarkWhere(
  personId: string,
  id?: string,
): Prisma.BookmarkWhereInput {
  return {
    ...(id ? { id } : {}),
    OR: [
      { ownerId: personId },
      { collection: { shares: { some: { granteePersonId: personId } } } },
    ],
  };
}
