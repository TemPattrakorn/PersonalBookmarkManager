import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../auth/auth.guard";
import { BookmarksService, type BookmarkResponse } from "./bookmarks.service";
import {
  parseBookmarkCreate,
  parseBookmarkListQuery,
  parseBookmarkPatch,
  parseUuid,
} from "../../common/http/request-validation";

@Controller("bookmarks")
export class BookmarksController {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse> {
    return this.bookmarks.create(request.person, parseBookmarkCreate(request));
  }

  @Get()
  list(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse[]> {
    const { collectionId, pagination } = parseBookmarkListQuery(request.query);
    return this.bookmarks.list(request.person, collectionId, pagination);
  }

  @Get(":id")
  get(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse> {
    return this.bookmarks.get(request.person, parseUuid(request.params.id));
  }

  @Patch(":id")
  update(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse> {
    return this.bookmarks.update(
      request.person,
      parseUuid(request.params.id),
      parseBookmarkPatch(request),
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.bookmarks.delete(request.person, parseUuid(request.params.id));
  }
}
