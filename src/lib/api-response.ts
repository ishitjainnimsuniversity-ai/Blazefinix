import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown) {
  console.error("[API Error Handler Caught]:", error);

  if (error instanceof ApiError) {
    return apiError(error.statusCode, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
    return apiError(422, "VALIDATION_ERROR", "Request validation failed", formattedErrors);
  }

  // Catch generic unexpected errors
  const message = error instanceof Error ? error.message : "Internal server error";
  return apiError(500, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred", {
    message: process.env.NODE_ENV === "development" ? message : undefined,
  });
}
