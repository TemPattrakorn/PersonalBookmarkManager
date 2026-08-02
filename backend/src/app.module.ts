import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ApiExceptionFilter } from "./api-exception.filter";
import { AuthGuard } from "./auth.guard";
import { AUTH_CONFIG, authConfig } from "./auth.contract";
import { Auth0Client } from "./auth0.client";
import { Auth0Transport } from "./auth0.transport";
import { AuthService } from "./auth.service";
import { MeController } from "./me.controller";
import { PrismaModule } from "./prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [MeController],
  providers: [
    Auth0Transport,
    Auth0Client,
    AuthService,
    { provide: AUTH_CONFIG, useValue: authConfig },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
