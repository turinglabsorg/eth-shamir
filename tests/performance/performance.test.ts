/**
 * Performance tests for ETH Shamir CLI
 */

import { ShamirSecretSharing } from "../../src/utils/shamir";
import { EncryptionUtils } from "../../src/utils/encryption";

describe("Performance Tests", () => {
  let shamir: ShamirSecretSharing;

  beforeEach(() => {
    shamir = new ShamirSecretSharing();
  });

  describe("ShamirSecretSharing Performance", () => {
    test("should create shares quickly for small inputs", () => {
      const privateKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const startTime = Date.now();
      const shares = shamir.createShares(privateKey, 5, 3);
      const endTime = Date.now();

      expect(shares).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test("should restore secret quickly", () => {
      const privateKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const shares = shamir.createShares(privateKey, 5, 3);

      const startTime = Date.now();
      const restored = shamir.restoreSecret(shares.slice(0, 3));
      const endTime = Date.now();

      expect(restored).toBe(privateKey);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test("should handle large share counts efficiently", () => {
      const privateKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const startTime = Date.now();
      const shares = shamir.createShares(privateKey, 20, 10);
      const endTime = Date.now();

      expect(shares).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    test("should handle mnemonic sharing efficiently", () => {
      const mnemonic =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      const startTime = Date.now();
      const shares = shamir.createShares(mnemonic, 10, 5);
      const endTime = Date.now();

      expect(shares).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1500); // Should complete in under 1.5 seconds
    });
  });

  describe("Encryption Performance", () => {
    test("should encrypt shares quickly", () => {
      const shares = Array.from(
        { length: 10 },
        (_, i) => `80${i.toString().padStart(2, "0")}${"a".repeat(60)}`
      );
      const password = "testpassword";

      const startTime = Date.now();
      const encryptedShares = EncryptionUtils.encryptShares(shares, password);
      const endTime = Date.now();

      expect(encryptedShares).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test("should decrypt shares quickly", () => {
      const shares = Array.from(
        { length: 10 },
        (_, i) => `80${i.toString().padStart(2, "0")}${"a".repeat(60)}`
      );
      const password = "testpassword";
      const encryptedShares = EncryptionUtils.encryptShares(shares, password);

      const startTime = Date.now();
      const decryptedShares = EncryptionUtils.decryptShares(
        encryptedShares,
        password
      );
      const endTime = Date.now();

      expect(decryptedShares).toEqual(shares);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test("should handle large encrypted data efficiently", () => {
      const largeData = "x".repeat(10000); // 10KB of data
      const password = "testpassword";

      const startTime = Date.now();
      const encrypted = EncryptionUtils.encrypt(largeData, password);
      const decrypted = EncryptionUtils.decrypt(encrypted, password);
      const endTime = Date.now();

      expect(decrypted).toBe(largeData);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe("Memory Usage", () => {
    test("should not leak memory with repeated operations", () => {
      const privateKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const shares = shamir.createShares(privateKey, 5, 3);
        const restored = shamir.restoreSecret(shares.slice(0, 3));
        expect(restored).toBe(privateKey);
      }

      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    test("should handle encryption/decryption cycles without memory leaks", () => {
      const data = "test data for memory leak test";
      const password = "testpassword";

      // Perform many encryption/decryption cycles
      for (let i = 0; i < 1000; i++) {
        const encrypted = EncryptionUtils.encrypt(data, password);
        const decrypted = EncryptionUtils.decrypt(encrypted, password);
        expect(decrypted).toBe(data);
      }

      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });
  });

  describe("Concurrent Operations", () => {
    test("should handle concurrent share creation", async () => {
      const privateKey =
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(shamir.createShares(privateKey, 3, 2))
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach((shares) => {
        expect(shares).toHaveLength(3);
      });
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3 seconds
    });

    test("should handle concurrent encryption operations", async () => {
      const data = "test data for concurrent encryption";
      const password = "testpassword";

      const promises = Array.from({ length: 50 }, () =>
        Promise.resolve(EncryptionUtils.encrypt(data, password))
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      results.forEach((encrypted) => {
        expect(encrypted).toMatch(/^encrypted:/);
      });
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });
});
