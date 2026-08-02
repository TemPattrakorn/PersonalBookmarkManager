import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { Person } from "../../generated/prisma/client";
import { AuthService } from "./auth.service";

export type AuthenticatedRequest = Request & { person: Person };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const person = await this.auth.authenticate(request.headers.authorization);
    (request as AuthenticatedRequest).person = person;
    return true;
  }
}
