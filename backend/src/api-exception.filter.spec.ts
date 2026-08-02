import {
  type ArgumentsHost,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { ApiExceptionFilter } from "./api-exception.filter";

describe("ApiExceptionFilter", () => {
  it("sanitizes unsupported media types", () => {
    const response = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    new ApiExceptionFilter().catch(new UnsupportedMediaTypeException(), host);

    expect(response.status).toHaveBeenCalledWith(415);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 415,
      message: "Unsupported media type",
    });
  });
});
