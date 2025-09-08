import chalk from "chalk";
import inquirer from "inquirer";
import { writeFileSync } from "fs";
import { join } from "path";
import { ShamirSecretSharing } from "../utils/shamir";

interface CreateOptions {
  key?: string;
  shares?: string;
  threshold?: string;
  output?: string;
  password?: string;
}

export async function createShares(options: CreateOptions): Promise<void> {
  let privateKey = options.key;

  // If no private key provided, prompt for it
  if (!privateKey) {
    const answers = await inquirer.prompt([
      {
        type: "password",
        name: "privateKey",
        message: "Enter Ethereum private key:",
        validate: (input: string) => {
          if (!input) {
            return "Private key is required";
          }

          // Remove 0x prefix if present
          const cleanInput = input.startsWith("0x")
            ? input.substring(2)
            : input;

          if (cleanInput.length !== 64) {
            return "Private key must be 64 characters long (32 bytes in hex)";
          }
          if (!/^[0-9a-fA-F]+$/.test(cleanInput)) {
            return "Private key must contain only hexadecimal characters";
          }
          return true;
        },
      },
    ]);
    privateKey = answers.privateKey;
  }

  // Remove 0x prefix if present and validate private key
  if (privateKey && privateKey.startsWith("0x")) {
    privateKey = privateKey.substring(2);
  }

  if (!privateKey || privateKey.length !== 64) {
    throw new Error("Private key must be 64 characters long (32 bytes in hex)");
  }
  if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
    throw new Error("Private key must contain only hexadecimal characters");
  }

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

  console.log(chalk.blue("Creating shares..."));
  console.log(
    chalk.gray(
      `Private key: ${privateKey.substring(0, 8)}...${privateKey.substring(56)}`
    )
  );
  console.log(chalk.gray(`Total shares: ${totalShares}`));
  console.log(chalk.gray(`Threshold: ${threshold}`));

  try {
    const shamir = new ShamirSecretSharing();
    const shares = shamir.createShares(
      privateKey,
      totalShares,
      threshold,
      options.password
    );

    console.log(chalk.green("\n✅ Shares created successfully!"));
    console.log(chalk.yellow("\n📋 Your shares:"));

    shares.forEach((share, index) => {
      console.log(chalk.cyan(`Share ${index + 1}: ${share}`));
    });

    console.log(chalk.yellow("\n⚠️  Important:"));
    console.log(chalk.white("• Store each share in a secure location"));
    console.log(
      chalk.white(
        "• You need at least " +
          threshold +
          " shares to restore the private key"
      )
    );
    console.log(chalk.white("• Never store all shares in the same place"));

    if (options.password) {
      console.log(chalk.yellow("\n🔐 Password Protection:"));
      console.log(chalk.white("• Shares are encrypted with your password"));
      console.log(
        chalk.white(
          "• You'll need the same password to restore the private key"
        )
      );
      console.log(
        chalk.white("• Keep your password secure and separate from the shares")
      );
    }

    // Save to file if output specified
    if (options.output) {
      const outputPath = join(process.cwd(), options.output);
      const content = shares
        .map((share, index) => `Share ${index + 1}: ${share}`)
        .join("\n");
      writeFileSync(outputPath, content, "utf8");
      console.log(chalk.green(`\n💾 Shares saved to: ${outputPath}`));
    }
  } catch (error) {
    throw new Error(
      `Failed to create shares: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
