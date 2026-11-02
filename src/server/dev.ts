import { DEMO_MODE } from "../lib/env";
import { AppError } from "./errors";

export function requireDemo() {
  if (!DEMO_MODE) throw new AppError("NOT_FOUND", "Not found", 404);
}
