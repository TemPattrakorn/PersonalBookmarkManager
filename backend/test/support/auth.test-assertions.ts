export async function expectAuthenticationRequired(response: Response): Promise<void> {
  expect(response.status).toBe(401);
  expect(response.headers.get("www-authenticate")).toBe("Bearer");
  await expect(response.json()).resolves.toEqual({
    statusCode: 401,
    message: "Authentication required",
  });
}

export async function expectServiceUnavailable(response: Response): Promise<void> {
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toEqual({
    statusCode: 503,
    message: "Service unavailable",
  });
}

export async function expectNotFound(response: Response): Promise<void> {
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({
    statusCode: 404,
    message: "Resource not found",
  });
}

export async function expectValidationFailure(response: Response): Promise<void> {
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    statusCode: 400,
    message: "Validation failed",
  });
}
