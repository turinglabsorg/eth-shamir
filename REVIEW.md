# Code Review: eth-shamir

## Overview

eth-shamir is a TypeScript CLI tool for splitting Ethereum private keys and mnemonics into shares using Shamir's Secret Sharing, with optional AES256 encryption and PDF/QR code generation. Overall, the project is well-structured with good test coverage (55+ tests across unit, E2E, and performance suites). Below are findings organized by severity.

---

## Bugs Fixed (PR #2)

### 1. `hexToString` strips all leading zeros — data corruption risk
**File:** `src/utils/shamir.ts:121-123`
**Severity:** High

The original code used `hex.replace(/^0+/, "")` which strips *all* leading zeros from the hex string. This corrupts private keys that legitimately start with `00` (roughly 1-in-256 keys). The `stringToHex` method only adds at most one zero for even-length alignment, so we should only strip one zero when the length is odd.

**Fix:** Changed to only strip a single leading zero when the hex length is odd (i.e., when padding was added by `stringToHex`).

### 2. Version mismatch between `src/index.ts` and `package.json`
**File:** `src/index.ts:17`
**Severity:** Low

`src/index.ts` hardcodes version `1.0.2` while `package.json` has `1.0.6`. The `--version` flag would show the wrong version.

**Fix:** Updated to `1.0.6`.

### 3. `generate --output` writes mnemonic in plaintext to file
**File:** `src/commands/generate.ts:91-99`
**Severity:** High (Security)

When using `generate --output`, the raw mnemonic was written in plaintext as a comment in the output file (`# Mnemonic: <words>`). This completely defeats the purpose of Shamir's Secret Sharing — anyone who finds the file gets the mnemonic directly without needing any shares.

**Fix:** Removed the mnemonic from the output file. Only shares are saved. A note is displayed telling the user to save the mnemonic separately.

### 4. Missing `NaN` validation for `--shares` and `--threshold` options
**Files:** `src/commands/create.ts:63-64`, `src/commands/generate.ts:21-22`
**Severity:** Medium

`parseInt()` returns `NaN` for non-numeric input. `NaN < 2` is `false`, so invalid inputs like `--shares abc` would slip through validation and cause cryptic errors from the `secrets.js-grempe` library.

**Fix:** Added explicit `isNaN()` checks with clear error messages.

---

## Issues Fixed (this PR)

### S4. Removed unused `generateSalt()` method
**File:** `src/utils/encryption.ts`

The `generateSalt()` method existed but was never called. Removed to avoid confusion.

### Q1. Extracted duplicated file-reading logic into shared utility
**Files:** `src/utils/file.ts` (new), `src/commands/restore.ts`, `src/commands/validate.ts`

The file reading logic (parsing "Share N: " format) was duplicated verbatim in both restore and validate commands. Extracted into `src/utils/file.ts` as `readSharesFromFile()`.

### Q4. Fixed platform-dependent `filepath.split("/").pop()`
**Files:** `src/commands/create.ts`, `src/commands/generate.ts`

Replaced `filepath.split("/").pop()` with `path.basename(filepath)` for cross-platform compatibility.

### Q5. Version now read from package.json
**File:** `src/index.ts`

The hardcoded version string has been replaced with a dynamic import from `package.json`, preventing future version drift.

### T1. Added tests for private keys starting with zero bytes
**File:** `tests/unit/shamir.test.ts`

Added test cases for private keys starting with `00` and `0000000` to verify the hex conversion fix works correctly for edge cases.

### D2. Removed unused `supertest` dependency
**File:** `package.json`

Removed `supertest` and `@types/supertest` from devDependencies — there are no HTTP tests in this project.

---

## Remaining Recommendations

### Security

#### S1. Password visible in process arguments
**Severity:** Medium
The `--password` CLI flag makes the password visible in `ps aux` output, shell history, and process listings. Consider prompting for the password interactively (like `inquirer.prompt` with `type: "password"`) instead of accepting it as a CLI argument.

#### S2. CryptoJS uses EVP_BytesToKey for key derivation
**Severity:** Low-Medium
CryptoJS's `AES.encrypt(text, password)` uses OpenSSL's EVP_BytesToKey with MD5, which has a fixed low iteration count. For a security-critical application, consider using PBKDF2 or scrypt with a configurable iteration count. However, changing this would break existing encrypted shares, so it should be a major version bump.

#### S3. No memory clearing of sensitive data
**Severity:** Low
Private keys and mnemonics are stored in JavaScript strings which cannot be reliably zeroed. This is a fundamental JavaScript limitation, but worth noting for security-conscious users.

### Code Quality

#### Q2. Duplicated validation logic
**Files:** `src/commands/create.ts:66-74`, `src/commands/generate.ts:24-32`, `src/utils/shamir.ts:25-33`
Threshold/shares validation is duplicated in three places. The `ShamirSecretSharing.createShares` method already validates, so the command-level validation is redundant (though provides slightly better error messages).

#### Q3. `validate` command fully reconstructs the secret
**File:** `src/commands/validate.ts:75`
The validate command calls `restoreSecret()` to check validity, which means it fully reconstructs the private key/mnemonic in memory. Consider adding a `validateOnly` method that verifies share format and compatibility without full reconstruction.

### Testing

#### T2. E2E test timeout is very long
**File:** `tests/e2e/cli.test.ts` — "should handle missing required arguments" takes 30+ seconds
This test waits for a timeout on interactive input. Consider using a shorter timeout or providing input to avoid the wait.

#### T3. No test for non-numeric `--shares`/`--threshold`
Add test cases for `--shares abc` and `--threshold xyz` to verify the NaN validation.

### Dependencies

#### D1. npm audit shows vulnerabilities
Run `npm audit fix` for non-breaking fixes. The `jspdf` dependency pulls in vulnerable transitive dependencies — upgrading to a newer major version would resolve this.

#### D3. Deprecated ESLint version
ESLint 8.x is deprecated. Consider migrating to ESLint 9.x with flat config.

### CI/CD

#### C1. Security audit `continue-on-error: true` hides vulnerabilities
**File:** `.github/workflows/ci.yml:74`
The security audit step never fails the build. Consider at least failing on critical/high severity.

#### C2. Release job bumps version without commit
**File:** `.github/workflows/ci.yml:138-139`
`npm version patch --no-git-tag-version` bumps the version locally but doesn't commit it back, so `package.json` in the repo always lags behind the published version.

---

## Summary

| Category | Fixed (PR #2) | Fixed (this PR) | Remaining |
|----------|:---:|:---:|:---:|
| Bugs | 4 | — | — |
| Security | — | 1 (S4) | 3 |
| Code quality | — | 3 (Q1, Q4, Q5) | 2 |
| Testing | — | 1 (T1) | 2 |
| Dependencies | — | 1 (D2) | 2 |
| CI/CD | — | — | 2 |

The project has a solid foundation with good separation of concerns and comprehensive test coverage. The most critical fixes (hex conversion bug and mnemonic file exposure) were applied in PR #2. This follow-up PR addresses the remaining actionable code quality, testing, and dependency issues from the review. The remaining recommendations are lower-priority items that can be addressed incrementally in future work.
