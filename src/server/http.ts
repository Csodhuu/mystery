import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function handleError(e: unknown) {
  if (e instanceof AppError) return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "INTERNAL", message: "Серверийн алдаа гарлаа" }, { status: 500 });
}

/** Wrap a route handler so AppErrors become JSON responses. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      return handleError(e);
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError("BAD_JSON", "Хүсэлт буруу байна");
  }
}
