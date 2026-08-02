import { Injectable, NotFoundException } from "@nestjs/common";
import type { Collection, Person } from "./generated/prisma/client";
import type { Pagination } from "./common/http/request-validation";
import {
  accessibleCollectionWhere,
  ownedCollectionWhere,
} from "./common/security/resource-access";
import { PrismaService } from "./core/database/prisma.service";

export type CollectionResponse = {
  id: string;
  name: string;
  access: "owner" | "viewer";
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(person: Person, name: string): Promise<CollectionResponse> {
    return this.response(
      await this.prisma.collection.create({ data: { name, ownerId: person.id } }),
      person.id,
    );
  }

  async list(
    person: Person,
    scope: "owned" | "shared",
    pagination: Pagination,
  ): Promise<CollectionResponse[]> {
    const collections = await this.prisma.collection.findMany({
      where:
        scope === "owned"
          ? ownedCollectionWhere(person.id)
          : {
              ownerId: { not: person.id },
              shares: { some: { granteePersonId: person.id } },
            },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    });
    return collections.map((collection) => this.response(collection, person.id));
  }

  async get(person: Person, id: string): Promise<CollectionResponse> {
    return this.response(await this.accessible(person.id, id), person.id);
  }

  async update(person: Person, id: string, name: string): Promise<CollectionResponse> {
    const updated = await this.prisma.collection.updateMany({
      where: ownedCollectionWhere(person.id, id),
      data: { name },
    });
    if (updated.count !== 1) missing();
    return this.response(await this.owned(person.id, id), person.id);
  }

  async delete(person: Person, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const collection = await tx.collection.findFirst({
        where: ownedCollectionWhere(person.id, id),
      });
      if (!collection) missing();
      await tx.bookmark.updateMany({
        where: { collectionId: id, ownerId: person.id },
        data: { collectionId: null },
      });
      await tx.collectionShare.deleteMany({ where: { collectionId: id } });
      await tx.collection.delete({ where: { id: collection.id } });
    });
  }

  async accessible(personId: string, id: string): Promise<Collection> {
    const collection = await this.prisma.collection.findFirst({
      where: accessibleCollectionWhere(personId, id),
    });
    if (!collection) missing();
    return collection;
  }

  async owned(personId: string, id: string): Promise<Collection> {
    const collection = await this.prisma.collection.findFirst({
      where: ownedCollectionWhere(personId, id),
    });
    if (!collection) missing();
    return collection;
  }

  private response(collection: Collection, personId: string): CollectionResponse {
    return {
      id: collection.id,
      name: collection.name,
      access: collection.ownerId === personId ? "owner" : "viewer",
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}

function missing(): never {
  throw new NotFoundException();
}
