import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CollectionShare, Person } from "./generated/prisma/client";
import { PrismaService } from "./prisma.service";
import { CollectionsService } from "./collections.service";
import type { Pagination } from "./request-validation";

export type ShareResponse = { id: string; email: string; createdAt: Date };
export type ShareCreateResponse = ShareResponse & { created: boolean };

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collections: CollectionsService,
  ) {}

  async create(person: Person, collectionId: string, email: string): Promise<ShareCreateResponse> {
    const collection = await this.collections.owned(person.id, collectionId);
    const recipients = await this.prisma.person.findMany({
      where: { normalizedEmail: email.toLowerCase(), emailVerified: true },
      take: 2,
    });
    if (recipients.length !== 1) missing();
    const recipient = recipients[0];
    if (recipient.id === person.id) throw new BadRequestException();

    const existing = await this.prisma.collectionShare.findUnique({
      where: {
        collectionId_granteePersonId: {
          collectionId: collection.id,
          granteePersonId: recipient.id,
        },
      },
    });
    if (existing) return { ...this.response(existing, recipient.email), created: false };

    try {
      const share = await this.prisma.collectionShare.create({
        data: { collectionId: collection.id, granteePersonId: recipient.id },
      });
      return { ...this.response(share, recipient.email), created: true };
    } catch (error) {
      if (!isUniqueConstraint(error)) throw error;
      const share = await this.prisma.collectionShare.findUnique({
        where: {
          collectionId_granteePersonId: {
            collectionId: collection.id,
            granteePersonId: recipient.id,
          },
        },
      });
      if (!share) throw error;
      return { ...this.response(share, recipient.email), created: false };
    }
  }

  async list(person: Person, collectionId: string, pagination: Pagination): Promise<ShareResponse[]> {
    await this.collections.owned(person.id, collectionId);
    const shares = await this.prisma.collectionShare.findMany({
      where: { collectionId },
      include: { grantee: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    });
    return shares.map((share) => this.response(share, share.grantee.email));
  }

  async revoke(person: Person, collectionId: string, shareId: string): Promise<void> {
    const deleted = await this.prisma.collectionShare.deleteMany({
      where: { id: shareId, collection: { id: collectionId, ownerId: person.id } },
    });
    if (deleted.count !== 1) missing();
  }

  async leave(person: Person, collectionId: string): Promise<void> {
    await this.prisma.collectionShare.deleteMany({
      where: { collectionId, granteePersonId: person.id },
    });
  }

  private response(share: CollectionShare, email: string): ShareResponse {
    return { id: share.id, email, createdAt: share.createdAt };
  }
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function missing(): never {
  throw new NotFoundException();
}
