import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "./auth.guard";
import { BookmarksService, type BookmarkResponse } from "./bookmarks.service";
import { CollectionsService, type CollectionResponse } from "./collections.service";
import {
  parseCollectionCreate,
  parseCollectionListQuery,
  parseCollectionPatch,
  parsePagination,
  parseShareCreate,
  parseUuid,
} from "./common/http/request-validation";
import { SharesService, type ShareResponse } from "./shares.service";

@Controller("collections")
export class CollectionsController {
  constructor(
    private readonly collections: CollectionsService,
    private readonly bookmarks: BookmarksService,
    private readonly shares: SharesService,
  ) {}

  @Post()
  create(@Req() request: AuthenticatedRequest): Promise<CollectionResponse> {
    return this.collections.create(request.person, parseCollectionCreate(request).name);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest): Promise<CollectionResponse[]> {
    const { scope, pagination } = parseCollectionListQuery(request.query);
    return this.collections.list(request.person, scope, pagination);
  }

  @Get(":id")
  get(@Req() request: AuthenticatedRequest): Promise<CollectionResponse> {
    return this.collections.get(request.person, parseUuid(request.params.id));
  }

  @Patch(":id")
  update(@Req() request: AuthenticatedRequest): Promise<CollectionResponse> {
    const input = parseCollectionPatch(request);
    return this.collections.update(request.person, parseUuid(request.params.id), input.name!);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.collections.delete(request.person, parseUuid(request.params.id));
  }

  @Get(":id/bookmarks")
  listBookmarks(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse[]> {
    return this.bookmarks.listForCollection(
      request.person,
      parseUuid(request.params.id),
      parsePagination(request.query, ["limit", "offset"]),
    );
  }

  @Post(":id/shares")
  async createShare(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ShareResponse> {
    const share = await this.shares.create(
      request.person,
      parseUuid(request.params.id),
      parseShareCreate(request).email,
    );
    response.status(share.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { id: share.id, email: share.email, createdAt: share.createdAt };
  }

  @Get(":id/shares")
  listShares(@Req() request: AuthenticatedRequest): Promise<ShareResponse[]> {
    return this.shares.list(
      request.person,
      parseUuid(request.params.id),
      parsePagination(request.query, ["limit", "offset"]),
    );
  }

  @Delete(":id/shares/:shareId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeShare(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.shares.revoke(
      request.person,
      parseUuid(request.params.id),
      parseUuid(request.params.shareId),
    );
  }

  @Delete(":id/share")
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.shares.leave(request.person, parseUuid(request.params.id));
  }
}
