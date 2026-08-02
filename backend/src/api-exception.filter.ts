import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
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

    if (statusOf(exception) === 400) {
      response.status(400).json({
        statusCode: 400,
        message: "Validation failed",
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

    if (statusOf(exception) === 415) {
      response.status(415).json({
        statusCode: 415,
        message: "Unsupported media type",
      });
      return;
    }

    response.status(500).json({
      statusCode: 500,
      message: "Internal server error",
    });
  }
}

function statusOf(exception: unknown): number | undefined {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  return typeof exception === "object" && exception !== null
    ? (exception as { status?: unknown }).status as number | undefined
    : undefined;
}
