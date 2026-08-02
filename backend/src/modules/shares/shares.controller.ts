import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import {
  parsePagination,
  parseShareCreate,
  parseUuid,
} from "../../common/http/request-validation";
import type { AuthenticatedRequest } from "../auth/auth.guard";
import { SharesService, type ShareResponse } from "./shares.service";

@Controller("collections/:collectionId")
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Post("shares")
  async create(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ShareResponse> {
    const share = await this.shares.create(
      request.person,
      parseUuid(request.params.collectionId),
      parseShareCreate(request).email,
    );
    response.status(share.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { id: share.id, email: share.email, createdAt: share.createdAt };
  }

  @Get("shares")
  list(@Req() request: AuthenticatedRequest): Promise<ShareResponse[]> {
    return this.shares.list(
      request.person,
      parseUuid(request.params.collectionId),
      parsePagination(request.query, ["limit", "offset"]),
    );
  }

  @Delete("shares/:shareId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.shares.revoke(
      request.person,
      parseUuid(request.params.collectionId),
      parseUuid(request.params.shareId),
    );
  }

  @Delete("share")
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.shares.leave(request.person, parseUuid(request.params.collectionId));
  }
}
