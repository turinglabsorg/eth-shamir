/**
 * Test utilities for end-to-end testing
 */

import { spawn, ChildProcess } from "child_process";
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
      const child = spawn("npm", ["run", "dev", "--", ...args], {
        cwd: process.cwd(),
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
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
    const filepath = join(this.tempDir, filename);
    return readFileSync(filepath, "utf8");
  }

  /**
   * Delete a temporary file
   */
  static deleteTempFile(filename: string): void {
    const filepath = join(this.tempDir, filename);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
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
    return mnemonicMatch ? mnemonicMatch[1] : null;
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
        output.includes("are valid"))
    );
  }

  /**
   * Check if output contains error message
   */
  static hasErrorMessage(output: string): boolean {
    return output.includes("Error:") || output.includes("❌");
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
