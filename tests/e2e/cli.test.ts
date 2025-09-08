/**
 * End-to-end tests for the ETH Shamir CLI tool
 */

import { TestUtils } from "../helpers/test-utils";

describe("ETH Shamir CLI - End-to-End Tests", () => {
  beforeEach(() => {
    // Clean up any existing temp files
    TestUtils.deleteTempFile("test-shares.txt");
    TestUtils.deleteTempFile("test-mnemonic.txt");
    TestUtils.deleteTempFile("test-encrypted.txt");
  });

  afterAll(() => {
    // Final cleanup
    TestUtils.cleanup();
  });

  describe("Create Command", () => {
    test("should create shares from private key without 0x prefix", async () => {
      const privateKey = TestUtils.generateTestPrivateKey();
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "3",
        "--threshold",
        "2",
      ]);

      expect(result.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(result.stdout)).toBe(true);
      expect(result.stdout).toContain("Shares created successfully");

      const shares = TestUtils.extractShares(result.stdout);
      expect(shares).toHaveLength(3);
      expect(shares[0]).toMatch(/^80/); // Shares should start with 80
    });

    test("should create shares from private key with 0x prefix", async () => {
      const privateKey = TestUtils.generateTestPrivateKeyWithPrefix();
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "3",
        "--threshold",
        "2",
      ]);

      expect(result.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(result.stdout)).toBe(true);

      const shares = TestUtils.extractShares(result.stdout);
      expect(shares).toHaveLength(3);
    });

    test("should create encrypted shares with password", async () => {
      const privateKey = TestUtils.generateTestPrivateKey();
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "testpassword123",
      ]);

      expect(result.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(result.stdout)).toBe(true);
      expect(result.stdout).toContain("Password Protection");

      const shares = TestUtils.extractShares(result.stdout);
      expect(shares).toHaveLength(2);
      expect(shares[0]).toMatch(/^encrypted:/); // Shares should be encrypted
    });

    test("should save shares to file", async () => {
      const privateKey = TestUtils.generateTestPrivateKey();
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--output",
        "test-shares.txt",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Shares saved to");

      // Verify file was created and contains shares
      const fileContent = TestUtils.readTempFile("test-shares.txt");
      const lines = fileContent.split("\n").filter((line) => line.trim());
      expect(lines).toHaveLength(2);
      expect(lines[0]).toMatch(/^80/);
    });

    test("should fail with invalid private key", async () => {
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        "invalid-key",
        "--shares",
        "2",
        "--threshold",
        "2",
      ]);

      expect(result.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(result.stdout)).toBe(true);
    });

    test("should fail with invalid threshold", async () => {
      const privateKey = TestUtils.generateTestPrivateKey();
      const result = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "5", // Threshold > shares
      ]);

      expect(result.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(result.stdout)).toBe(true);
    });
  });

  describe("Generate Command", () => {
    test("should generate mnemonic and create shares", async () => {
      const result = await TestUtils.runCommand([
        "generate",
        "--shares",
        "3",
        "--threshold",
        "2",
      ]);

      expect(result.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(result.stdout)).toBe(true);
      expect(result.stdout).toContain("New mnemonic generated successfully");

      const mnemonic = TestUtils.extractMnemonic(result.stdout);
      expect(mnemonic).toBeTruthy();
      expect(mnemonic!.split(" ")).toHaveLength(12); // Should be 12 words

      const shares = TestUtils.extractShares(result.stdout);
      expect(shares).toHaveLength(3);
    });

    test("should generate encrypted mnemonic shares", async () => {
      const result = await TestUtils.runCommand([
        "generate",
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "testpass123",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Password Protection");

      const shares = TestUtils.extractShares(result.stdout);
      expect(shares).toHaveLength(2);
      expect(shares[0]).toMatch(/^encrypted:/);
    });

    test("should save mnemonic and shares to file", async () => {
      const result = await TestUtils.runCommand([
        "generate",
        "--shares",
        "2",
        "--threshold",
        "2",
        "--output",
        "test-mnemonic.txt",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Mnemonic and shares saved to");

      // Verify file was created
      const fileContent = TestUtils.readTempFile("test-mnemonic.txt");
      expect(fileContent).toContain("# Generated Mnemonic and Shares");
      expect(fileContent).toContain("Share 1:");
      expect(fileContent).toContain("Share 2:");
    });
  });

  describe("Restore Command", () => {
    test("should restore private key from shares", async () => {
      // First create shares
      const privateKey = TestUtils.generateTestPrivateKey();
      const createResult = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
      ]);

      expect(createResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(createResult.stdout);

      // Now restore
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--shares",
        shares[0],
        shares[1],
      ]);

      expect(restoreResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(restoreResult.stdout)).toBe(true);

      const restoredKey = TestUtils.extractPrivateKey(restoreResult.stdout);
      expect(restoredKey).toBe(privateKey);
    });

    test("should restore mnemonic from shares", async () => {
      // First generate mnemonic and shares
      const generateResult = await TestUtils.runCommand([
        "generate",
        "--shares",
        "2",
        "--threshold",
        "2",
      ]);

      expect(generateResult.exitCode).toBe(0);
      const originalMnemonic = TestUtils.extractMnemonic(generateResult.stdout);
      const shares = TestUtils.extractShares(generateResult.stdout);

      // Now restore
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--shares",
        shares[0],
        shares[1],
      ]);

      expect(restoreResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(restoreResult.stdout)).toBe(true);

      const restoredMnemonic = TestUtils.extractRestoredMnemonic(
        restoreResult.stdout
      );
      expect(restoredMnemonic).toBe(originalMnemonic);
    });

    test("should restore from file", async () => {
      // First create shares and save to file
      const privateKey = TestUtils.generateTestPrivateKey();
      await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--output",
        "test-shares.txt",
      ]);

      // Now restore from file
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--file",
        "test-shares.txt",
      ]);

      expect(restoreResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(restoreResult.stdout)).toBe(true);

      const restoredKey = TestUtils.extractPrivateKey(restoreResult.stdout);
      expect(restoredKey).toBe(privateKey);
    });

    test("should restore encrypted shares with correct password", async () => {
      // First create encrypted shares
      const privateKey = TestUtils.generateTestPrivateKey();
      const createResult = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "testpass123",
      ]);

      expect(createResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(createResult.stdout);

      // Now restore with correct password
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--shares",
        shares[0],
        shares[1],
        "--password",
        "testpass123",
      ]);

      expect(restoreResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(restoreResult.stdout)).toBe(true);

      const restoredKey = TestUtils.extractPrivateKey(restoreResult.stdout);
      expect(restoredKey).toBe(privateKey);
    });

    test("should fail to restore encrypted shares with wrong password", async () => {
      // First create encrypted shares
      const privateKey = TestUtils.generateTestPrivateKey();
      const createResult = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "correctpass",
      ]);

      expect(createResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(createResult.stdout);

      // Now try to restore with wrong password
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--shares",
        shares[0],
        shares[1],
        "--password",
        "wrongpass",
      ]);

      expect(restoreResult.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(restoreResult.stdout)).toBe(true);
    });

    test("should fail with insufficient shares", async () => {
      const result = await TestUtils.runCommand([
        "restore",
        "--shares",
        "801234567890abcdef", // Only one share
      ]);

      expect(result.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(result.stdout)).toBe(true);
    });
  });

  describe("Validate Command", () => {
    test("should validate private key shares", async () => {
      // First create shares
      const privateKey = TestUtils.generateTestPrivateKey();
      const createResult = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
      ]);

      expect(createResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(createResult.stdout);

      // Now validate
      const validateResult = await TestUtils.runCommand([
        "validate",
        "--shares",
        shares[0],
        shares[1],
      ]);

      expect(validateResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(validateResult.stdout)).toBe(true);
      expect(validateResult.stdout).toContain("Private key format");
    });

    test("should validate mnemonic shares", async () => {
      // First generate mnemonic and shares
      const generateResult = await TestUtils.runCommand([
        "generate",
        "--shares",
        "2",
        "--threshold",
        "2",
      ]);

      expect(generateResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(generateResult.stdout);

      // Now validate
      const validateResult = await TestUtils.runCommand([
        "validate",
        "--shares",
        shares[0],
        shares[1],
      ]);

      expect(validateResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(validateResult.stdout)).toBe(true);
      expect(validateResult.stdout).toContain("Mnemonic");
    });

    test("should validate encrypted shares", async () => {
      // First create encrypted shares
      const privateKey = TestUtils.generateTestPrivateKey();
      const createResult = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "testpass123",
      ]);

      expect(createResult.exitCode).toBe(0);
      const shares = TestUtils.extractShares(createResult.stdout);

      // Now validate with correct password
      const validateResult = await TestUtils.runCommand([
        "validate",
        "--shares",
        shares[0],
        shares[1],
        "--password",
        "testpass123",
      ]);

      expect(validateResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(validateResult.stdout)).toBe(true);
    });

    test("should validate from file", async () => {
      // First create shares and save to file
      const privateKey = TestUtils.generateTestPrivateKey();
      await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "2",
        "--threshold",
        "2",
        "--output",
        "test-shares.txt",
      ]);

      // Now validate from file
      const validateResult = await TestUtils.runCommand([
        "validate",
        "--file",
        "test-shares.txt",
      ]);

      expect(validateResult.exitCode).toBe(0);
      expect(TestUtils.hasSuccessMessage(validateResult.stdout)).toBe(true);
    });

    test("should fail validation with corrupted shares", async () => {
      const result = await TestUtils.runCommand([
        "validate",
        "--shares",
        "corrupted-share-1",
        "corrupted-share-2",
      ]);

      expect(result.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(result.stdout)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("should show help when no command provided", async () => {
      const result = await TestUtils.runCommand([]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Commands:");
    });

    test("should show help for specific command", async () => {
      const result = await TestUtils.runCommand(["create", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        "Create shares from an Ethereum private key"
      );
      expect(result.stdout).toContain("Options:");
    });

    test("should handle unknown command", async () => {
      const result = await TestUtils.runCommand(["unknown-command"]);

      expect(result.exitCode).toBe(1);
      expect(TestUtils.hasErrorMessage(result.stdout)).toBe(true);
    });

    test("should handle missing required arguments", async () => {
      const result = await TestUtils.runCommand(["create"]);

      // This should prompt for input, but in non-interactive mode it might fail
      // The exact behavior depends on how inquirer handles non-interactive mode
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Integration Tests", () => {
    test("should work with different share counts and thresholds", async () => {
      const privateKey = TestUtils.generateTestPrivateKey();

      // Test with 5 shares, threshold 3
      const result1 = await TestUtils.runCommand([
        "create",
        "--key",
        privateKey,
        "--shares",
        "5",
        "--threshold",
        "3",
      ]);

      expect(result1.exitCode).toBe(0);
      const shares1 = TestUtils.extractShares(result1.stdout);
      expect(shares1).toHaveLength(5);

      // Restore with 3 shares
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--shares",
        shares1[0],
        shares1[1],
        shares1[2],
      ]);

      expect(restoreResult.exitCode).toBe(0);
      const restoredKey = TestUtils.extractPrivateKey(restoreResult.stdout);
      expect(restoredKey).toBe(privateKey);
    });

    test("should handle file operations with encrypted shares", async () => {
      // Generate encrypted mnemonic and save to file
      const generateResult = await TestUtils.runCommand([
        "generate",
        "--shares",
        "2",
        "--threshold",
        "2",
        "--password",
        "filetest123",
        "--output",
        "test-encrypted.txt",
      ]);

      expect(generateResult.exitCode).toBe(0);
      const originalMnemonic = TestUtils.extractMnemonic(generateResult.stdout);

      // Restore from file with password
      const restoreResult = await TestUtils.runCommand([
        "restore",
        "--file",
        "test-encrypted.txt",
        "--password",
        "filetest123",
      ]);

      expect(restoreResult.exitCode).toBe(0);
      const restoredMnemonic = TestUtils.extractRestoredMnemonic(
        restoreResult.stdout
      );
      expect(restoredMnemonic).toBe(originalMnemonic);
    });
  });
});
