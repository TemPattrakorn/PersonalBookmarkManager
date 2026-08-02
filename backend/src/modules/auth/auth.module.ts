import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "../../core/database/prisma.module";
import { AUTH_CONFIG, authConfig } from "./auth.contract";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { Auth0Client } from "./auth0.client";
import { Auth0Transport } from "./auth0.transport";
import { MeController } from "./me.controller";

@Module({
  imports: [PrismaModule],
  controllers: [MeController],
  providers: [
    Auth0Transport,
    Auth0Client,
    AuthService,
    { provide: AUTH_CONFIG, useValue: authConfig },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
