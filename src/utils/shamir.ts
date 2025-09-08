/**
 * Shamir's Secret Sharing implementation for Ethereum private keys
 * Using the well-tested secrets.js-grempe library for production-grade security
 * Supports optional AES256 password encryption
 */

import * as secrets from "secrets.js-grempe";
import { EncryptionUtils } from "./encryption";

export class ShamirSecretSharing {
  /**
   * Create shares from a secret using Shamir's Secret Sharing
   * @param secret The secret to share (as hex string or mnemonic)
   * @param totalShares Total number of shares to create
   * @param threshold Minimum number of shares needed to restore the secret
   * @param password Optional password to encrypt the secret and shares
   * @returns Array of share strings (encrypted if password provided)
   */
  createShares(
    secret: string,
    totalShares: number,
    threshold: number,
    password?: string
  ): string[] {
    if (threshold > totalShares) {
      throw new Error("Threshold cannot be greater than total shares");
    }
    if (threshold < 2) {
      throw new Error("Threshold must be at least 2");
    }
    if (totalShares < 2) {
      throw new Error("Total shares must be at least 2");
    }

    try {
      let secretToShare = secret;

      // Encrypt the secret if password is provided
      if (password) {
        secretToShare = EncryptionUtils.encrypt(secret, password);
      }

      // Convert secret to hex format for sharing
      const hexSecret = this.stringToHex(secretToShare);

      // Create shares using secrets.js-grempe
      const shares = secrets.share(hexSecret, totalShares, threshold);

      // Encrypt shares if password is provided
      if (password) {
        return EncryptionUtils.encryptShares(shares, password);
      }

      return shares;
    } catch (error) {
      throw new Error(
        `Failed to create shares: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Restore the secret from shares using Lagrange interpolation
   * @param shares Array of share strings (encrypted or plain)
   * @param password Optional password to decrypt shares and secret
   * @returns The restored secret as original string (hex or mnemonic)
   */
  restoreSecret(shares: string[], password?: string): string {
    if (shares.length < 2) {
      throw new Error("At least 2 shares are required");
    }

    try {
      let sharesToUse = shares;

      // Decrypt shares if password is provided and shares appear encrypted
      if (password && EncryptionUtils.isEncrypted(shares[0])) {
        sharesToUse = EncryptionUtils.decryptShares(shares, password);
      }

      // Combine shares using secrets.js-grempe
      const restoredHexSecret = secrets.combine(sharesToUse);

      // Convert back to original string format
      let restoredSecret = this.hexToString(restoredHexSecret);

      // Decrypt the secret if it appears to be encrypted
      if (password && EncryptionUtils.isEncrypted(restoredSecret)) {
        restoredSecret = EncryptionUtils.decrypt(restoredSecret, password);
      }

      return restoredSecret;
    } catch (error) {
      throw new Error(
        `Failed to restore secret: ${
          error instanceof Error ? error.message : "Invalid shares or password"
        }`
      );
    }
  }

  /**
   * Convert string to hex format for sharing
   */
  private stringToHex(str: string): string {
    // If it's already a hex string (like private keys), return as is
    if (/^[0-9a-fA-F]+$/.test(str)) {
      // Ensure even length for complete bytes
      return str.length % 2 !== 0 ? "0" + str : str;
    }

    // Convert string to hex
    return Buffer.from(str, "utf8").toString("hex");
  }

  /**
   * Convert hex back to original string format
   */
  private hexToString(hex: string): string {
    // Remove leading zeros
    const cleanHex = hex.replace(/^0+/, "") || "0";

    // If it's a 64-character hex string, it's likely a private key
    if (cleanHex.length === 64 && /^[0-9a-fA-F]+$/.test(cleanHex)) {
      return cleanHex;
    }

    // Try to decode as UTF-8 string
    try {
      const decoded = Buffer.from(cleanHex, "hex").toString("utf8");

      // Check if it's an encrypted string (starts with "encrypted:")
      if (decoded.startsWith("encrypted:")) {
        return decoded;
      }

      // If it contains valid UTF-8 characters and looks like a mnemonic, return it
      if (/^[a-z\s]+$/.test(decoded) && decoded.split(" ").length >= 12) {
        return decoded;
      }

      // If it's a valid UTF-8 string but not a mnemonic, return it (could be encrypted data)
      if (decoded.length > 0 && /[\x20-\x7E]/.test(decoded)) {
        return decoded;
      }
    } catch (error) {
      // If UTF-8 decoding fails, it's probably a hex string
    }

    // Return as hex string
    return cleanHex;
  }
}
