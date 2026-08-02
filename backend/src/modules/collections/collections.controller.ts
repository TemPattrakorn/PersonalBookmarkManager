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
import { CollectionsService, type CollectionResponse } from "./collections.service";
import {
  parseCollectionCreate,
  parseCollectionListQuery,
  parseCollectionPatch,
  parseUuid,
} from "../../common/http/request-validation";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

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
}
