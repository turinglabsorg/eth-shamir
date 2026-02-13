import chalk from "chalk";
import inquirer from "inquirer";
import { ShamirSecretSharing } from "../utils/shamir";
import { readSharesFromFile } from "../utils/file";

interface ValidateOptions {
  shares?: string[];
  file?: string;
  password?: string;
}

export async function validateShares(options: ValidateOptions): Promise<void> {
  let shares: string[] = [];

  if (options.file) {
    try {
      shares = readSharesFromFile(options.file);
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
        message: "Enter shares to validate (comma-separated):",
        validate: (input: string) => {
          const shareList = input
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          if (shareList.length < 2) {
            return "At least 2 shares are required for validation";
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
    throw new Error("At least 2 shares are required for validation");
  }

  console.log(chalk.blue("Validating shares..."));
  console.log(chalk.gray(`Validating ${shares.length} shares`));

  try {
    const shamir = new ShamirSecretSharing();

    // Try to restore the secret to validate the shares
    const privateKey = shamir.restoreSecret(shares, options.password);

    // Check if it's a mnemonic or private key
    const isMnemonic =
      /^[a-z\s]+$/.test(privateKey) && privateKey.split(" ").length >= 12;
    const isPrivateKey =
      /^[0-9a-fA-F]+$/.test(privateKey) && privateKey.length === 64;

    if (!isMnemonic && !isPrivateKey) {
      throw new Error(
        "Shares contain invalid data - neither mnemonic nor private key format"
      );
    }

    console.log(chalk.green("\n✅ Shares are valid!"));
    console.log(chalk.yellow("\n📊 Validation results:"));
    console.log(chalk.white(`• Number of shares: ${shares.length}`));

    if (isMnemonic) {
      console.log(
        chalk.white(
          `• Secret type: Mnemonic (${privateKey.split(" ").length} words)`
        )
      );
      console.log(
        chalk.white(
          `• Mnemonic preview: ${privateKey
            .split(" ")
            .slice(0, 3)
            .join(" ")}...`
        )
      );
      console.log(chalk.yellow("\n💡 Note:"));
      console.log(
        chalk.white("• These shares can be used to restore the mnemonic")
      );
      console.log(
        chalk.white(
          "• The mnemonic can be used to derive private keys and access accounts"
        )
      );
      console.log(
        chalk.white(
          "• The full mnemonic was not displayed for security reasons"
        )
      );
    } else {
      console.log(
        chalk.white(`• Secret type: Private key (64 hex characters)`)
      );
      console.log(
        chalk.white(
          `• Private key preview: ${privateKey.substring(
            0,
            8
          )}...${privateKey.substring(56)}`
        )
      );
      console.log(chalk.yellow("\n💡 Note:"));
      console.log(
        chalk.white("• These shares can be used to restore the private key")
      );
      console.log(
        chalk.white("• The private key was not displayed for security reasons")
      );
    }
  } catch (error) {
    console.log(chalk.red("\n❌ Shares validation failed!"));
    console.log(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );

    console.log(chalk.yellow("\n🔍 Possible issues:"));
    console.log(chalk.white("• One or more shares may be corrupted"));
    console.log(
      chalk.white("• Shares may be from different secret sharing sessions")
    );
    console.log(
      chalk.white("• Insufficient number of shares for the threshold")
    );

    throw error;
  }
}
