import { Injectable, NotFoundException } from "@nestjs/common";
import type { Bookmark, Person } from "./generated/prisma/client";
import { PrismaService } from "./core/database/prisma.service";
import { CollectionsService } from "./collections.service";
import { accessibleBookmarkWhere } from "./common/security/resource-access";
import type {
  BookmarkCreateInput,
  BookmarkPatchInput,
  Pagination,
} from "./common/http/request-validation";

export type BookmarkResponse = {
  id: string;
  url: string;
  title: string;
  notes: string | null;
  collectionId: string | null;
  access: "owner" | "viewer";
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BookmarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionsService,
  ) {}

  async create(person: Person, input: BookmarkCreateInput): Promise<BookmarkResponse> {
    await this.ensureOwnedCollection(person.id, input.collectionId);
    return this.response(
      await this.prisma.bookmark.create({ data: { ...input, ownerId: person.id } }),
      person.id,
    );
  }

  async list(
    person: Person,
    collectionId: string | undefined,
    pagination: Pagination,
  ): Promise<BookmarkResponse[]> {
    if (collectionId !== undefined) {
      await this.collections.accessible(person.id, collectionId);
      const bookmarks = await this.prisma.bookmark.findMany({
        where: { collectionId, ...accessibleBookmarkWhere(person.id) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.offset,
        take: pagination.limit,
      });
      return bookmarks.map((bookmark) => this.response(bookmark, person.id));
    }
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { ownerId: person.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    });
    return bookmarks.map((bookmark) => this.response(bookmark, person.id));
  }

  async listForCollection(
    person: Person,
    collectionId: string,
    pagination: Pagination,
  ): Promise<BookmarkResponse[]> {
    await this.collections.accessible(person.id, collectionId);
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { collectionId, ...accessibleBookmarkWhere(person.id) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    });
    return bookmarks.map((bookmark) => this.response(bookmark, person.id));
  }

  async get(person: Person, id: string): Promise<BookmarkResponse> {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: accessibleBookmarkWhere(person.id, id),
    });
    if (!bookmark) missing();
    return this.response(bookmark, person.id);
  }

  async update(
    person: Person,
    id: string,
    input: BookmarkPatchInput,
  ): Promise<BookmarkResponse> {
    await this.ensureOwnedCollection(person.id, input.collectionId);
    const updated = await this.prisma.bookmark.updateMany({
      where: { id, ownerId: person.id },
      data: input,
    });
    if (updated.count !== 1) missing();
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, ownerId: person.id },
    });
    if (!bookmark) missing();
    return this.response(bookmark, person.id);
  }

  async delete(person: Person, id: string): Promise<void> {
    const deleted = await this.prisma.bookmark.deleteMany({
      where: { id, ownerId: person.id },
    });
    if (deleted.count !== 1) missing();
  }

  private async ensureOwnedCollection(personId: string, collectionId: string | null | undefined) {
    if (collectionId !== undefined && collectionId !== null) {
      await this.collections.owned(personId, collectionId);
    }
  }

  private response(bookmark: Bookmark, personId: string): BookmarkResponse {
    return {
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      notes: bookmark.notes,
      collectionId: bookmark.collectionId,
      access: bookmark.ownerId === personId ? "owner" : "viewer",
      createdAt: bookmark.createdAt,
      updatedAt: bookmark.updatedAt,
    };
  }
}

function missing(): never {
  throw new NotFoundException();
}
