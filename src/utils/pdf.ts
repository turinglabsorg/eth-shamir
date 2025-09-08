/**
 * PDF generation utilities for creating share documents with QR codes
 */

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { writeFileSync } from "fs";
import { join } from "path";

export interface PDFShareOptions {
  shareNumber: number;
  totalShares: number;
  threshold: number;
  shareData: string;
  isEncrypted: boolean;
  password?: string;
  outputPath: string;
  title?: string;
  subtitle?: string;
}

export class PDFGenerator {
  private static readonly PAGE_WIDTH = 210; // A4 width in mm
  private static readonly PAGE_HEIGHT = 297; // A4 height in mm
  private static readonly MARGIN = 20;
  private static readonly QR_SIZE = 100; // QR code size in mm - reduced for better layout

  /**
   * Generate a PDF document for a single share with QR code
   */
  static async generateSharePDF(options: PDFShareOptions): Promise<string> {
    const doc = new jsPDF();

    // Set up the document
    this.setupDocument(doc, options);

    // Add header
    this.addHeader(doc, options);

    // Generate and add QR code
    await this.addQRCode(doc, options);

    // Add share information
    this.addShareInfo(doc, options);

    // Add security warnings
    this.addSecurityWarnings(doc);

    // Save the PDF
    const filename = this.generateFilename(options);
    const filepath = join(options.outputPath, filename);
    doc.save(filepath);

    return filepath;
  }

  /**
   * Generate multiple PDF files for all shares
   */
  static async generateAllSharePDFs(
    shares: string[],
    options: Omit<
      PDFShareOptions,
      "shareNumber" | "shareData" | "outputPath"
    > & {
      outputPath: string;
      baseFilename?: string;
    }
  ): Promise<string[]> {
    const filepaths: string[] = [];

    for (let i = 0; i < shares.length; i++) {
      const shareOptions: PDFShareOptions = {
        ...options,
        shareNumber: i + 1,
        shareData: shares[i],
        outputPath: options.outputPath,
        title: options.title || "Ethereum Private Key Share",
        subtitle: options.subtitle || `Share ${i + 1} of ${shares.length}`,
      };

      const filepath = await this.generateSharePDF(shareOptions);
      filepaths.push(filepath);
    }

    return filepaths;
  }

  private static setupDocument(doc: jsPDF, options: PDFShareOptions): void {
    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(12);
  }

  private static addHeader(doc: jsPDF, options: PDFShareOptions): void {
    const centerX = this.PAGE_WIDTH / 2;
    let y = this.MARGIN;

    // Title only
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(options.title || "Ethereum Private Key Share", centerX, y, {
      align: "center",
    });
    y += 25; // More space after title

    if (options.isEncrypted) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 0, 0); // Red color
      doc.text("ENCRYPTED SHARE", centerX, y, { align: "center" });
      doc.setTextColor(0, 0, 0); // Reset to black
      y += 15;
    }
  }

  private static async addQRCode(
    doc: jsPDF,
    options: PDFShareOptions
  ): Promise<void> {
    const centerX = this.PAGE_WIDTH / 2;
    const qrY = 70; // Moved up slightly to give more space below
    const qrX = centerX - this.QR_SIZE / 2;

    try {
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(options.shareData, {
        width: this.QR_SIZE * 3.78, // Convert mm to pixels (3.78 pixels per mm)
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Add QR code to PDF
      doc.addImage(qrDataURL, "PNG", qrX, qrY, this.QR_SIZE, this.QR_SIZE);

      // Add border around QR code
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(qrX - 2, qrY - 2, this.QR_SIZE + 4, this.QR_SIZE + 4);
    } catch (error) {
      // Fallback: add text if QR code generation fails
      doc.setFontSize(10);
      doc.text("QR Code generation failed", centerX, qrY + this.QR_SIZE / 2, {
        align: "center",
      });
      doc.text("Share data:", centerX, qrY + this.QR_SIZE / 2 + 10, {
        align: "center",
      });
      doc.text(options.shareData, centerX, qrY + this.QR_SIZE / 2 + 20, {
        align: "center",
      });
    }
  }

  private static addShareInfo(doc: jsPDF, options: PDFShareOptions): void {
    const centerX = this.PAGE_WIDTH / 2;
    let y = 200; // Start higher to ensure all content fits

    // Share number and total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Share ${options.shareNumber} of ${options.totalShares}`,
      centerX,
      y,
      { align: "center" }
    );
    y += 15; // More space after share number

    // Instructions (removed Share Data section)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Instructions:", centerX, y, { align: "center" });
    y += 8;

    doc.setFontSize(9); // Smaller font for instructions
    doc.setFont("helvetica", "normal");
    const instructions = [
      "1. Scan the QR code above to get the share data",
      "2. Keep this document in a secure location",
      "3. You need at least " +
        options.threshold +
        " shares to restore the private key",
      "4. Never store all shares in the same place",
    ];

    if (options.isEncrypted) {
      instructions.push("5. You will need the password to restore this share");
    }

    instructions.forEach((instruction) => {
      doc.text(instruction, centerX, y, { align: "center" });
      y += 6; // Slightly more spacing between instructions
    });
  }

  private static addSecurityWarnings(doc: jsPDF): void {
    const centerX = this.PAGE_WIDTH / 2;
    const boxHeight = 32; // Fixed height for the warning box
    const y = this.PAGE_HEIGHT - this.MARGIN - boxHeight; // Position from bottom

    // Security warning box
    doc.setFillColor(255, 255, 0); // Yellow background
    doc.setDrawColor(255, 0, 0); // Red border
    doc.setLineWidth(1);
    doc.rect(
      this.MARGIN,
      y,
      this.PAGE_WIDTH - 2 * this.MARGIN,
      boxHeight,
      "FD"
    );

    // Warning text - positioned within the box with proper margins
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 0, 0); // Red text
    doc.text("⚠️ SECURITY WARNING", centerX, y + 8, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This document contains sensitive cryptographic data.",
      centerX,
      y + 16,
      { align: "center" }
    );
    doc.text(
      "Store securely and never share with unauthorized parties.",
      centerX,
      y + 24,
      { align: "center" }
    );
  }

  private static generateFilename(options: PDFShareOptions): string {
    const baseName =
      options.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, "") || // Remove leading/trailing hyphens
      "eth-share";
    const shareNum = options.shareNumber.toString().padStart(2, "0");
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    return `${baseName}-${shareNum}-of-${options.totalShares}-${timestamp}.pdf`;
  }
}
