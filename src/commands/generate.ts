import chalk from "chalk";
import { writeFileSync } from "fs";
import { join } from "path";
import { generateMnemonic, mnemonicToAccount, english } from "viem/accounts";
import { ShamirSecretSharing } from "../utils/shamir";

interface GenerateOptions {
  shares?: string;
  threshold?: string;
  output?: string;
  language?: string;
  password?: string;
}

export async function generateMnemonicAndShares(
  options: GenerateOptions
): Promise<void> {
  const totalShares = parseInt(options.shares || "5", 10);
  const threshold = parseInt(options.threshold || "3", 10);

  if (totalShares < 2) {
    throw new Error("Total shares must be at least 2");
  }
  if (threshold < 2) {
    throw new Error("Threshold must be at least 2");
  }
  if (threshold > totalShares) {
    throw new Error("Threshold cannot be greater than total shares");
  }

  console.log(chalk.blue("Generating new mnemonic and creating shares..."));

  try {
    // Generate a new mnemonic phrase
    const mnemonic = generateMnemonic(english);

    // Create account from mnemonic to get the address
    const account = mnemonicToAccount(mnemonic);

    console.log(chalk.green("\n✅ New mnemonic generated successfully!"));
    console.log(chalk.yellow("\n🔑 Generated Account:"));
    console.log(chalk.cyan(`Address: ${account.address}`));
    console.log(chalk.cyan(`Mnemonic: ${mnemonic}`));

    // Create shares from the mnemonic
    const shamir = new ShamirSecretSharing();
    const shares = shamir.createShares(
      mnemonic,
      totalShares,
      threshold,
      options.password
    );

    console.log(chalk.yellow("\n📋 Your mnemonic shares:"));

    shares.forEach((share, index) => {
      console.log(chalk.cyan(`Share ${index + 1}: ${share}`));
    });

    console.log(chalk.yellow("\n⚠️  Important:"));
    console.log(chalk.white("• Store each share in a secure location"));
    console.log(
      chalk.white(
        "• You need at least " + threshold + " shares to restore the mnemonic"
      )
    );
    console.log(chalk.white("• Never store all shares in the same place"));
    console.log(
      chalk.white(
        "• The mnemonic can be used to derive the private key and access the account"
      )
    );

    if (options.password) {
      console.log(chalk.yellow("\n🔐 Password Protection:"));
      console.log(chalk.white("• Shares are encrypted with your password"));
      console.log(
        chalk.white("• You'll need the same password to restore the mnemonic")
      );
      console.log(
        chalk.white("• Keep your password secure and separate from the shares")
      );
    }

    // Save to file if output specified
    if (options.output) {
      const outputPath = join(process.cwd(), options.output);
      const content = [
        `# Generated Mnemonic and Shares`,
        `# Generated on: ${new Date().toISOString()}`,
        `# Account Address: ${account.address}`,
        `# Mnemonic: ${mnemonic}`,
        ``,
        `# Shares (${totalShares} total, ${threshold} threshold):`,
        ...shares.map((share, index) => `Share ${index + 1}: ${share}`),
      ].join("\n");

      writeFileSync(outputPath, content, "utf8");
      console.log(
        chalk.green(`\n💾 Mnemonic and shares saved to: ${outputPath}`)
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to generate mnemonic and shares: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
