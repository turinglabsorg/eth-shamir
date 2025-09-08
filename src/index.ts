#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createShares } from "./commands/create";
import { restoreKey } from "./commands/restore";
import { validateShares } from "./commands/validate";
import { generateMnemonicAndShares } from "./commands/generate";

const program = new Command();

program
  .name("eth-shamir")
  .description(
    "Create and restore Ethereum private keys using Shamir's Secret Sharing"
  )
  .version("1.0.2");

program
  .command("create")
  .description("Create shares from an Ethereum private key")
  .option(
    "-k, --key <privateKey>",
    "Ethereum private key (with or without 0x prefix)"
  )
  .option("-n, --shares <number>", "Total number of shares to create", "5")
  .option("-t, --threshold <number>", "Minimum shares required to restore", "3")
  .option("-o, --output <file>", "Output file for shares (optional)")
  .option("-p, --password <password>", "Password to encrypt shares (optional)")
  .option("--pdf", "Generate PDF documents with QR codes for each share")
  .option(
    "--pdf-output <directory>",
    "Directory to save PDF files (default: shares-pdf)"
  )
  .action(async (options) => {
    try {
      await createShares(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

program
  .command("restore")
  .description("Restore private key from shares")
  .option("-s, --shares <shares...>", "Share strings to use for restoration")
  .option("-f, --file <file>", "File containing shares (one per line)")
  .option("-p, --password <password>", "Password to decrypt shares (optional)")
  .action(async (options) => {
    try {
      await restoreKey(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate shares without restoring the key")
  .option("-s, --shares <shares...>", "Share strings to validate")
  .option("-f, --file <file>", "File containing shares (one per line)")
  .option("-p, --password <password>", "Password to decrypt shares (optional)")
  .action(async (options) => {
    try {
      await validateShares(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

program
  .command("generate")
  .description("Generate a new mnemonic and create shares from it")
  .option("-n, --shares <number>", "Total number of shares to create", "5")
  .option("-t, --threshold <number>", "Minimum shares required to restore", "3")
  .option(
    "-o, --output <file>",
    "Output file for mnemonic and shares (optional)"
  )
  .option("-p, --password <password>", "Password to encrypt shares (optional)")
  .option("--pdf", "Generate PDF documents with QR codes for each share")
  .option(
    "--pdf-output <directory>",
    "Directory to save PDF files (default: mnemonic-shares-pdf)"
  )
  .action(async (options) => {
    try {
      await generateMnemonicAndShares(options);
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : "Unknown error"
      );
      process.exit(1);
    }
  });

// Handle unknown commands
program.on("command:*", () => {
  console.error(chalk.red("Invalid command: %s"), program.args.join(" "));
  console.log("See --help for a list of available commands.");
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
