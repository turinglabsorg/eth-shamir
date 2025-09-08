/**
 * Test utilities for end-to-end testing
 */

import { spawn } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class TestUtils {
  private static tempDir = join(process.cwd(), "tests", "fixtures");

  /**
   * Run a CLI command and return the result
   */
  static async runCommand(args: string[]): Promise<CommandResult> {
    return new Promise((resolve) => {
      const child = spawn("node", ["dist/index.js", ...args], {
        cwd: process.cwd(),
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        resolve({
          stdout,
          stderr:
            stderr + "\n[TEST TIMEOUT] Command timed out after 30 seconds",
          exitCode: 124, // Standard timeout exit code
        });
      }, 30000); // 30 second timeout

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });

      child.on("error", (error) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr: stderr + `\n[SPAWN ERROR] ${error.message}`,
          exitCode: 1,
        });
      });
    });
  }

  /**
   * Create a temporary file with content
   */
  static createTempFile(filename: string, content: string): string {
    const filepath = join(this.tempDir, filename);
    writeFileSync(filepath, content, "utf8");
    return filepath;
  }

  /**
   * Read a temporary file
   */
  static readTempFile(filename: string): string {
    // First try the fixtures directory, then the current directory
    const fixturesPath = join(this.tempDir, filename);
    const currentPath = join(process.cwd(), filename);

    if (existsSync(fixturesPath)) {
      return readFileSync(fixturesPath, "utf8");
    } else if (existsSync(currentPath)) {
      return readFileSync(currentPath, "utf8");
    } else {
      throw new Error(`File not found: ${filename}`);
    }
  }

  /**
   * Delete a temporary file
   */
  static deleteTempFile(filename: string): void {
    const fixturesPath = join(this.tempDir, filename);
    const currentPath = join(process.cwd(), filename);

    if (existsSync(fixturesPath)) {
      unlinkSync(fixturesPath);
    }
    if (existsSync(currentPath)) {
      unlinkSync(currentPath);
    }
  }

  /**
   * Clean up all temporary files
   */
  static cleanup(): void {
    // This would be implemented to clean up all temp files
    // For now, we'll clean up files individually in tests
  }

  /**
   * Extract shares from command output
   */
  static extractShares(output: string): string[] {
    const shareRegex = /Share \d+: (.+)/g;
    const shares: string[] = [];
    let match;

    while ((match = shareRegex.exec(output)) !== null) {
      shares.push(match[1]);
    }

    return shares;
  }

  /**
   * Extract mnemonic from command output
   */
  static extractMnemonic(output: string): string | null {
    const mnemonicMatch = output.match(/Mnemonic: (.+)/);
    return mnemonicMatch ? mnemonicMatch[1].trim() : null;
  }

  /**
   * Extract private key from command output
   */
  static extractPrivateKey(output: string): string | null {
    const keyMatch = output.match(/Restored private key:\s*(.+)/);
    return keyMatch ? keyMatch[1].trim() : null;
  }

  /**
   * Extract restored mnemonic from command output
   */
  static extractRestoredMnemonic(output: string): string | null {
    const mnemonicMatch = output.match(/Restored mnemonic:\s*(.+)/);
    return mnemonicMatch ? mnemonicMatch[1].trim() : null;
  }

  /**
   * Check if output contains success message
   */
  static hasSuccessMessage(output: string): boolean {
    return (
      output.includes("✅") &&
      (output.includes("created successfully") ||
        output.includes("restored successfully") ||
        output.includes("are valid") ||
        output.includes("generated successfully"))
    );
  }

  /**
   * Check if output contains error message
   */
  static hasErrorMessage(output: string, stderr?: string): boolean {
    const combinedOutput = output + (stderr || "");
    return (
      combinedOutput.includes("Error:") ||
      combinedOutput.includes("❌") ||
      combinedOutput.startsWith("Error:") ||
      combinedOutput.startsWith("Invalid command:")
    );
  }

  /**
   * Generate a test private key
   */
  static generateTestPrivateKey(): string {
    return "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  }

  /**
   * Generate a test private key with 0x prefix
   */
  static generateTestPrivateKeyWithPrefix(): string {
    return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  }

  /**
   * Generate a test mnemonic (12 words)
   */
  static generateTestMnemonic(): string {
    return "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  }
}
