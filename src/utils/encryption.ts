/**
 * AES256 encryption utilities for protecting secrets and shares
 */

import CryptoJS from "crypto-js";

export class EncryptionUtils {
  /**
   * Encrypt a string using AES256 with a password
   * @param text The text to encrypt
   * @param password The password to use for encryption
   * @returns Encrypted string in format: "encrypted:<base64>"
   */
  static encrypt(text: string, password: string): string {
    const encrypted = CryptoJS.AES.encrypt(text, password).toString();
    return `encrypted:${encrypted}`;
  }

  /**
   * Decrypt a string using AES256 with a password
   * @param encryptedText The encrypted text (with or without "encrypted:" prefix)
   * @param password The password to use for decryption
   * @returns Decrypted string
   */
  static decrypt(encryptedText: string, password: string): string {
    // Remove "encrypted:" prefix if present
    const cleanText = encryptedText.startsWith("encrypted:")
      ? encryptedText.substring(10)
      : encryptedText;

    const decrypted = CryptoJS.AES.decrypt(cleanText, password);
    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error("Failed to decrypt - invalid password or corrupted data");
    }

    return result;
  }

  /**
   * Check if a string is encrypted (has "encrypted:" prefix)
   * @param text The text to check
   * @returns True if the text appears to be encrypted
   */
  static isEncrypted(text: string): boolean {
    return text.startsWith("encrypted:");
  }

  /**
   * Encrypt an array of shares
   * @param shares Array of share strings
   * @param password Password to encrypt with
   * @returns Array of encrypted shares
   */
  static encryptShares(shares: string[], password: string): string[] {
    return shares.map((share) => this.encrypt(share, password));
  }

  /**
   * Decrypt an array of shares
   * @param encryptedShares Array of encrypted share strings
   * @param password Password to decrypt with
   * @returns Array of decrypted shares
   */
  static decryptShares(encryptedShares: string[], password: string): string[] {
    return encryptedShares.map((share) => this.decrypt(share, password));
  }

  /**
   * Generate a random salt for additional security
   * @returns Random salt string
   */
  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}
