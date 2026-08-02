import { Module } from "@nestjs/common";
import { PrismaModule } from "../../core/database/prisma.module";
import { CollectionsModule } from "../collections/collections.module";
import { BookmarksController } from "./bookmarks.controller";
import { BookmarksService } from "./bookmarks.service";
import { CollectionBookmarksController } from "./collection-bookmarks.controller";

@Module({
  imports: [PrismaModule, CollectionsModule],
  controllers: [BookmarksController, CollectionBookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
