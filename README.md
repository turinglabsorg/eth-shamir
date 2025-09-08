# ETH Shamir

A TypeScript command-line tool for creating and restoring Ethereum private keys and mnemonics using Shamir's Secret Sharing scheme with comprehensive testing and CI/CD support.

## Features

- 🔐 **Secure Secret Sharing**: Split Ethereum private keys and mnemonics into multiple shares
- 🔑 **Key Restoration**: Restore private keys and mnemonics from a threshold number of shares
- ✅ **Share Validation**: Validate shares without revealing the secret
- 🎯 **Flexible Thresholds**: Configure total shares and minimum threshold
- 📁 **File Support**: Save/load shares from files
- 🖥️ **Interactive Mode**: User-friendly command-line interface
- 🌱 **Mnemonic Generation**: Generate new mnemonics with viem and create shares automatically
- 🔒 **Password Protection**: Optional AES256 encryption for additional security
- 🧪 **Comprehensive Testing**: Full test suite with unit, E2E, and performance tests
- 🚀 **CI/CD Ready**: GitHub Actions workflow for automated testing and deployment

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd eth-shamir

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Create Shares

Split an Ethereum private key into multiple shares:

```bash
# Interactive mode
npm run dev -- create

# Command line mode
npm run dev create -- --key <private-key> --shares 5 --threshold 3

# Save shares to file
npm run dev create -- --key <private-key> --shares 5 --threshold 3 --output shares.txt

# With password protection
npm run dev create -- --key <private-key> --shares 5 --threshold 3 --password "mypassword"
```

### Restore Private Key

Restore a private key from shares:

```bash
# Interactive mode
npm run dev restore

# From command line arguments
npm run dev restore -- --shares <share1> <share2> <share3>

# From file
npm run dev restore -- --file shares.txt

# With password protection
npm run dev restore --shares <share1> <share2> <share3> --password "mypassword"
```

### Validate Shares

Validate shares without restoring the secret:

```bash
# Interactive mode
npm run dev validate

# From command line arguments
npm run dev validate -- --shares <share1> <share2> <share3>

# From file
npm run dev validate -- --file shares.txt

# With password protection
npm run dev validate -- --shares <share1> <share2> <share3> --password "mypassword"
```

### Generate Mnemonic and Shares

Generate a new mnemonic and automatically create shares:

```bash
# Interactive mode
npm run dev generate

# Command line mode
npm run dev generate -- --shares 5 --threshold 3

# Save to file
npm run dev generate -- --shares 5 --threshold 3 --output mnemonic-shares.txt

# With password protection
npm run dev generate -- --shares 5 --threshold 3 --password "mypassword"
```

## Command Options

### Create Command
- `-k, --key <privateKey>`: Ethereum private key (64 hex characters, with or without 0x prefix)
- `-n, --shares <number>`: Total number of shares to create (default: 5)
- `-t, --threshold <number>`: Minimum shares required to restore (default: 3)
- `-o, --output <file>`: Output file for shares (optional)
- `-p, --password <password>`: Password to encrypt shares (optional)

### Restore Command
- `-s, --shares <shares...>`: Share strings to use for restoration
- `-f, --file <file>`: File containing shares (one per line)
- `-p, --password <password>`: Password to decrypt shares (optional)

### Validate Command
- `-s, --shares <shares...>`: Share strings to validate
- `-f, --file <file>`: File containing shares (one per line)
- `-p, --password <password>`: Password to decrypt shares (optional)

### Generate Command
- `-n, --shares <number>`: Total number of shares to create (default: 5)
- `-t, --threshold <number>`: Minimum shares required to restore (default: 3)
- `-o, --output <file>`: Output file for mnemonic and shares (optional)
- `-p, --password <password>`: Password to encrypt shares (optional)

## Examples

### Example 1: Create 5 shares with threshold 3

```bash
# With 0x prefix
npm run dev create --key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --shares 5 --threshold 3

# Without 0x prefix (also works)
npm run dev create --key 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --shares 5 --threshold 3
```

### Example 2: Restore from 3 shares

```bash
npm run dev restore --shares 01a1b2c3d4e5f6... 02f6e5d4c3b2a1... 03b2a1c3d4e5f6...
```

### Example 3: Save shares to file and restore from file

```bash
# Create and save shares (with 0x prefix)
npm run dev create --key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --output my-shares.txt

# Restore from file
npm run dev restore --file my-shares.txt
```

### Example 4: Generate new mnemonic and create shares

```bash
# Generate mnemonic and create 5 shares with threshold 3
npm run dev generate -- --shares 5 --threshold 3

# Generate and save to file
npm run dev generate -- --shares 3 --threshold 2 --output my-mnemonic.txt
```

### Example 5: Password Protection

```bash
# Create encrypted shares
npm run dev create --key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef -- --shares 3 --threshold 2 --password "securepassword"

# Restore with password
npm run dev restore -- --shares <encrypted-share1> <encrypted-share2> --password "securepassword"

# Generate encrypted mnemonic shares
npm run dev generate -- --shares 3 --threshold 2 --password "securepassword"
```

## Password Protection

The tool supports optional AES256 password protection for enhanced security:

### How it Works

1. **Secret Encryption**: If a password is provided, the original secret (private key or mnemonic) is encrypted using AES256
2. **Share Creation**: The encrypted secret is then split into shares using Shamir's Secret Sharing
3. **Share Encryption**: Each share is individually encrypted with the same password
4. **Double Protection**: This provides two layers of security - the secret is encrypted, and the shares are also encrypted

### Security Benefits

- **Defense in Depth**: Multiple layers of encryption
- **Share Security**: Even if individual shares are compromised, they're encrypted
- **Secret Security**: The original secret is encrypted before being split
- **Password Separation**: Keep your password separate from your shares

### Usage Notes

- **Password Required**: You must provide the same password when restoring encrypted shares
- **Password Security**: Choose a strong, unique password and store it securely
- **No Recovery**: If you lose the password, the shares cannot be decrypted
- **Optional Feature**: Password protection is optional - you can use the tool without it

## Testing

This project includes a comprehensive test suite with multiple test types:

### Test Types

- **Unit Tests**: Test individual components and utilities
- **E2E Tests**: Test complete CLI workflows and user interactions
- **Performance Tests**: Test performance and memory usage under load

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:e2e           # End-to-end tests only
npm run test:performance   # Performance tests only
npm run test:all           # All tests

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run in CI mode
npm run test:ci

# Use custom test runner
node scripts/test.js [test-type]
```

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   └── shamir.test.ts   # Core functionality tests
├── e2e/                 # End-to-end tests
│   └── cli.test.ts      # CLI workflow tests
├── performance/         # Performance tests
│   └── performance.test.ts
├── helpers/             # Test utilities
│   └── test-utils.ts    # Test helper functions
├── fixtures/            # Test data and files
└── setup.ts            # Test setup configuration
```

## Development

### Available Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with ts-node
- `npm start`: Run the compiled JavaScript
- `npm run clean`: Clean build artifacts
- `npm test`: Run all tests
- `npm run test:unit`: Run unit tests only
- `npm run test:e2e`: Run E2E tests only
- `npm run test:performance`: Run performance tests only
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:watch`: Run tests in watch mode
- `npm run test:ci`: Run tests in CI mode
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues

### Project Structure

```
src/
├── index.ts              # Main CLI entry point
├── commands/             # Command implementations
│   ├── create.ts         # Create shares command
│   ├── restore.ts        # Restore key command
│   ├── validate.ts       # Validate shares command
│   └── generate.ts       # Generate mnemonic command
└── utils/                # Utility functions
    ├── shamir.ts         # Shamir's Secret Sharing implementation
    └── encryption.ts     # AES256 encryption utilities

tests/                    # Test suite
├── unit/                 # Unit tests
├── e2e/                  # End-to-end tests
├── performance/          # Performance tests
├── helpers/              # Test utilities
└── fixtures/             # Test data

.github/
└── workflows/
    └── ci.yml           # CI/CD pipeline

scripts/
└── test.js              # Custom test runner
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

- Runs tests on multiple Node.js versions (18.x, 20.x)
- Performs security audits
- Generates coverage reports
- Builds and tests the CLI package
- Automatically publishes to npm on main branch pushes

### Code Quality

- **ESLint**: Code linting with TypeScript support
- **Jest**: Testing framework with coverage reporting
- **TypeScript**: Strong typing and compile-time error checking
- **Prettier**: Code formatting (if configured)

## Security Considerations

⚠️ **Important Security Notes:**

1. **Private Key Security**: Never share your private key with anyone
2. **Share Distribution**: Store shares in different secure locations
3. **Threshold Management**: Choose appropriate threshold values
4. **Share Destruction**: Consider destroying shares after use
5. **Environment Security**: Run in secure environments only
6. **Password Security**: Use strong, unique passwords for encryption
7. **Password Storage**: Store passwords separately from shares
8. **Backup Strategy**: Have secure backup strategies for both shares and passwords

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite: `npm test`
6. Ensure all tests pass: `npm run test:ci`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Ensure CI/CD pipeline passes
- Follow semantic versioning for releases
