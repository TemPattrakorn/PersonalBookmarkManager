import { Controller, Get, Req } from "@nestjs/common";
import type { AuthenticatedRequest } from "./auth.guard";

@Controller("me")
export class MeController {
  @Get()
  getMe(@Req() request: AuthenticatedRequest): { email: string } {
    return { email: request.person.email };
  }
}
