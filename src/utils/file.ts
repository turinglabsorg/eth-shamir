import { readFileSync } from "fs";
import { join } from "path";

/**
 * Read shares from a file in the "Share N: <data>" format.
 * Lines not matching this format are ignored.
 */
export function readSharesFromFile(filePath: string): string[] {
  const fullPath = join(process.cwd(), filePath);
  const content = readFileSync(fullPath, "utf8");
  return content
    .split("\n")
    .filter((line) => line.trim().length > 0 && line.startsWith("Share "))
    .map((line) => line.replace(/^Share \d+: /, "").trim());
}
