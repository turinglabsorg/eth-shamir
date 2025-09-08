/**
 * Test setup file
 */

import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// Ensure test fixtures directory exists
const fixturesDir = join(process.cwd(), "tests", "fixtures");
if (!existsSync(fixturesDir)) {
  mkdirSync(fixturesDir, { recursive: true });
}

// Set test environment variables
process.env.NODE_ENV = "test";

// Global test timeout
jest.setTimeout(30000);
