import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ApiExceptionFilter } from "./api-exception.filter";
import { AuthGuard } from "./auth.guard";
import { AUTH_CONFIG, authConfig } from "./auth.contract";
import { Auth0Client } from "./auth0.client";
import { Auth0Transport } from "./auth0.transport";
import { AuthService } from "./auth.service";
import { BookmarksController } from "./bookmarks.controller";
import { BookmarksService } from "./bookmarks.service";
import { CollectionsController } from "./collections.controller";
import { CollectionsService } from "./collections.service";
import { MeController } from "./me.controller";
import { PrismaModule } from "./prisma.module";
import { SharesService } from "./shares.service";

@Module({
  imports: [PrismaModule],
  controllers: [MeController, CollectionsController, BookmarksController],
  providers: [
    Auth0Transport,
    Auth0Client,
    AuthService,
    CollectionsService,
    BookmarksService,
    SharesService,
    { provide: AUTH_CONFIG, useValue: authConfig },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
