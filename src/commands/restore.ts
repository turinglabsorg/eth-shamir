import chalk from "chalk";
import inquirer from "inquirer";
import { readFileSync } from "fs";
import { join } from "path";
import { ShamirSecretSharing } from "../utils/shamir";

interface RestoreOptions {
  shares?: string[];
  file?: string;
  password?: string;
}

export async function restoreKey(options: RestoreOptions): Promise<void> {
  let shares: string[] = [];

  if (options.file) {
    // Read shares from file
    try {
      const filePath = join(process.cwd(), options.file);
      const content = readFileSync(filePath, "utf8");
      shares = content
        .split("\n")
        .filter((line) => line.trim().length > 0 && line.startsWith("Share "))
        .map((line) => line.replace(/^Share \d+: /, "").trim());
      console.log(
        chalk.blue(
          `📁 Loaded ${shares.length} shares from file: ${options.file}`
        )
      );
    } catch (error) {
      throw new Error(
        `Failed to read file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } else if (options.shares && options.shares.length > 0) {
    shares = options.shares;
  } else {
    // Prompt for shares interactively
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "shares",
        message: "Enter shares (comma-separated):",
        validate: (input: string) => {
          const shareList = input
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          if (shareList.length < 2) {
            return "At least 2 shares are required";
          }
          return true;
        },
      },
    ]);
    shares = answers.shares
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  if (shares.length < 2) {
    throw new Error(
      "At least 2 shares are required to restore the private key"
    );
  }

  console.log(chalk.blue("Restoring secret..."));
  console.log(chalk.gray(`Using ${shares.length} shares`));

  try {
    const shamir = new ShamirSecretSharing();
    const restoredSecret = shamir.restoreSecret(shares, options.password);

    // Check if it's a mnemonic or private key
    const isMnemonic =
      /^[a-z\s]+$/.test(restoredSecret) &&
      restoredSecret.split(" ").length >= 12;
    const isPrivateKey =
      /^[0-9a-fA-F]+$/.test(restoredSecret) && restoredSecret.length === 64;

    if (isMnemonic) {
      console.log(chalk.green("\n✅ Mnemonic restored successfully!"));
      console.log(chalk.yellow("\n🔑 Restored mnemonic:"));
      console.log(chalk.cyan(restoredSecret));

      console.log(chalk.yellow("\n⚠️  Security reminder:"));
      console.log(chalk.white("• Keep this mnemonic secure"));
      console.log(chalk.white("• Never share it with anyone"));
      console.log(
        chalk.white(
          "• This mnemonic can be used to derive private keys and access accounts"
        )
      );
      console.log(
        chalk.white(
          "• Consider using it immediately and then destroying the shares"
        )
      );
    } else if (isPrivateKey) {
      console.log(chalk.green("\n✅ Private key restored successfully!"));
      console.log(chalk.yellow("\n🔑 Restored private key:"));
      console.log(chalk.cyan(restoredSecret));

      console.log(chalk.yellow("\n⚠️  Security reminder:"));
      console.log(chalk.white("• Keep this private key secure"));
      console.log(chalk.white("• Never share it with anyone"));
      console.log(
        chalk.white(
          "• Consider using it immediately and then destroying the shares"
        )
      );
    } else {
      throw new Error(
        "Restored secret is neither a valid mnemonic nor a valid private key"
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to restore secret: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
