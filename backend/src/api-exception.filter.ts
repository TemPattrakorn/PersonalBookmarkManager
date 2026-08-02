import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from "@nestjs/common";
import type { Response } from "express";
import {
  AuthenticationRequiredError,
  Auth0UnavailableError,
} from "./auth.contract";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AuthenticationRequiredError) {
      response.setHeader("WWW-Authenticate", "Bearer");
      response.status(401).json({
        statusCode: 401,
        message: "Authentication required",
      });
      return;
    }

    if (exception instanceof Auth0UnavailableError) {
      response.status(503).json({
        statusCode: 503,
        message: "Service unavailable",
      });
      return;
    }

    if (exception instanceof NotFoundException) {
      response.status(404).json({
        statusCode: 404,
        message: "Resource not found",
      });
      return;
    }

    response.status(500).json({
      statusCode: 500,
      message: "Internal server error",
    });
  }
}
