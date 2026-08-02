import { Controller, Get, Req } from "@nestjs/common";
import { parsePagination, parseUuid } from "../../common/http/request-validation";
import type { AuthenticatedRequest } from "../auth/auth.guard";
import { BookmarksService, type BookmarkResponse } from "./bookmarks.service";

@Controller("collections/:collectionId/bookmarks")
export class CollectionBookmarksController {
  constructor(private readonly bookmarks: BookmarksService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest): Promise<BookmarkResponse[]> {
    return this.bookmarks.listForCollection(
      request.person,
      parseUuid(request.params.collectionId),
      parsePagination(request.query, ["limit", "offset"]),
    );
  }
}
