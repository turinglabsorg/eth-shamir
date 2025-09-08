/**
 * Unit tests for PDF generation functionality
 */

import { PDFGenerator, PDFShareOptions } from "../../src/utils/pdf";
import { existsSync, unlinkSync, mkdirSync, rmdirSync } from "fs";
import { join } from "path";

describe("PDFGenerator", () => {
  const testOutputDir = join(process.cwd(), "test-pdf-output");

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      const files = require("fs").readdirSync(testOutputDir);
      files.forEach((file: string) => {
        unlinkSync(join(testOutputDir, file));
      });
    } else {
      mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testOutputDir)) {
      const files = require("fs").readdirSync(testOutputDir);
      files.forEach((file: string) => {
        unlinkSync(join(testOutputDir, file));
      });
      rmdirSync(testOutputDir);
    }
  });

  describe("generateSharePDF", () => {
    test("should generate a PDF file for a single share", async () => {
      const options: PDFShareOptions = {
        shareNumber: 1,
        totalShares: 3,
        threshold: 2,
        shareData:
          "801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Test Share",
        subtitle: "Test Share Document",
      };

      const filepath = await PDFGenerator.generateSharePDF(options);

      expect(filepath).toBeDefined();
      expect(existsSync(filepath)).toBe(true);
      expect(filepath).toContain("test-share-01-of-3");
      expect(filepath).toContain(".pdf");
    });

    test("should generate PDF with encrypted share", async () => {
      const options: PDFShareOptions = {
        shareNumber: 1,
        totalShares: 2,
        threshold: 2,
        shareData:
          "encrypted:U2FsdGVkX18e+z/idsSNyU4ODueq53rhZzAb0Ago6/juDs1QXPl4mxkjhqFpMMqAhh6B0AFnpQUc8oVyo7gvecWGSeit30Ioy07eNXVNTQavHU1NFwyIWAfcrq23p1BVMp+oQVaQ6dNjMQlKiP/psl2HcmdO1TX3yYfEB3vQbvMjzYKFFlqNXonaiMEeV6wPOrrnRXS1R8e4yz3L4j/JkFuUZqv2/cVW7vEnAAwDu1Ueu81hYXpm3qnOoNUsFeI5IGYwaNQSxUhoWnoP2pIB89kx9Fgt48jbwtFdSTLI6TpbzDMaJYBsH9q26KFg0uJkGyqzWWm+wmIH1mC2PVDAijMxdgAank+66fkXjtHyY8F8QDShr8Kma1HaQJituUgGJrTXP03qht30gXamtUVcnX3MEJheVVAQRQ/fae5rNXA=",
        isEncrypted: true,
        password: "testpassword",
        outputPath: testOutputDir,
        title: "Encrypted Share",
        subtitle: "Encrypted Share Document",
      };

      const filepath = await PDFGenerator.generateSharePDF(options);

      expect(filepath).toBeDefined();
      expect(existsSync(filepath)).toBe(true);
      expect(filepath).toContain("encrypted-share-01-of-2");
    });

    test("should handle QR code generation errors gracefully", async () => {
      const options: PDFShareOptions = {
        shareNumber: 1,
        totalShares: 1,
        threshold: 1,
        shareData: "", // Empty data might cause QR code issues
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Test Share",
        subtitle: "Test Share Document",
      };

      // Should not throw an error even with problematic data
      const filepath = await PDFGenerator.generateSharePDF(options);

      expect(filepath).toBeDefined();
      expect(existsSync(filepath)).toBe(true);
    });
  });

  describe("generateAllSharePDFs", () => {
    test("should generate multiple PDF files for all shares", async () => {
      const shares = [
        "801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "802345678901bcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "803456789012cdef1234567890abcdef1234567890abcdef1234567890abcdef",
      ];

      const options = {
        totalShares: 3,
        threshold: 2,
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Test Shares",
        subtitle: "Test Share Documents",
      };

      const filepaths = await PDFGenerator.generateAllSharePDFs(
        shares,
        options
      );

      expect(filepaths).toHaveLength(3);

      filepaths.forEach((filepath, index) => {
        expect(filepath).toBeDefined();
        expect(existsSync(filepath)).toBe(true);
        expect(filepath).toContain(
          `test-shares-${(index + 1).toString().padStart(2, "0")}-of-3`
        );
      });
    });

    test("should generate PDFs with custom base filename", async () => {
      const shares = [
        "801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "802345678901bcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      ];

      const options = {
        totalShares: 2,
        threshold: 2,
        isEncrypted: false,
        outputPath: testOutputDir,
        baseFilename: "custom-share",
        title: "Custom Share",
        subtitle: "Custom Share Document",
      };

      const filepaths = await PDFGenerator.generateAllSharePDFs(
        shares,
        options
      );

      expect(filepaths).toHaveLength(2);

      filepaths.forEach((filepath, index) => {
        expect(filepath).toContain(
          `custom-share-${(index + 1).toString().padStart(2, "0")}-of-2`
        );
      });
    });

    test("should handle empty shares array", async () => {
      const shares: string[] = [];
      const options = {
        totalShares: 0,
        threshold: 0,
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Empty Shares",
        subtitle: "Empty Share Document",
      };

      const filepaths = await PDFGenerator.generateAllSharePDFs(
        shares,
        options
      );

      expect(filepaths).toHaveLength(0);
    });
  });

  describe("filename generation", () => {
    test("should generate appropriate filenames with timestamps", async () => {
      const options: PDFShareOptions = {
        shareNumber: 1,
        totalShares: 5,
        threshold: 3,
        shareData:
          "801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Ethereum Private Key Share",
        subtitle: "Secure Share Document",
      };

      const filepath = await PDFGenerator.generateSharePDF(options);
      const filename = filepath.split("/").pop();

      expect(filename).toMatch(
        /^ethereum-private-key-share-01-of-5-\d{4}-\d{2}-\d{2}\.pdf$/
      );
    });

    test("should handle special characters in title", async () => {
      const options: PDFShareOptions = {
        shareNumber: 1,
        totalShares: 1,
        threshold: 1,
        shareData:
          "801234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        isEncrypted: false,
        outputPath: testOutputDir,
        title: "Test & Share (Special) Characters!",
        subtitle: "Test Document",
      };

      const filepath = await PDFGenerator.generateSharePDF(options);
      const filename = filepath.split("/").pop();

      expect(filename).toMatch(
        /^test-share-special-characters-01-of-1-\d{4}-\d{2}-\d{2}\.pdf$/
      );
    });
  });
});
