import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { AuthModule } from "./modules/auth/auth.module";
import { BookmarksModule } from "./modules/bookmarks/bookmarks.module";
import { CollectionsModule } from "./modules/collections/collections.module";
import { SharesModule } from "./modules/shares/shares.module";

@Module({
  imports: [AuthModule, CollectionsModule, BookmarksModule, SharesModule],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
