#!/usr/bin/env node

/**
 * Test runner script for different test suites
 */

const { spawn } = require('child_process');
const path = require('path');

const testTypes = {
    unit: 'Unit tests only',
    e2e: 'End-to-end tests only',
    performance: 'Performance tests only',
    all: 'All tests (default)'
};

function runTests(testType = 'all') {
    let testPattern = '';

    switch (testType) {
        case 'unit':
            testPattern = 'tests/unit';
            break;
        case 'e2e':
            testPattern = 'tests/e2e';
            break;
        case 'performance':
            testPattern = 'tests/performance';
            break;
        case 'all':
        default:
            testPattern = 'tests';
            break;
    }

    console.log(`\n🧪 Running ${testTypes[testType]}...\n`);

    const jest = spawn('npx', ['jest', testPattern, '--verbose'], {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    jest.on('close', (code) => {
        if (code === 0) {
            console.log(`\n✅ ${testTypes[testType]} completed successfully!\n`);
        } else {
            console.log(`\n❌ ${testTypes[testType]} failed with exit code ${code}\n`);
            process.exit(code);
        }
    });

    jest.on('error', (error) => {
        console.error(`\n❌ Failed to run tests: ${error.message}\n`);
        process.exit(1);
    });
}

function showHelp() {
    console.log(`
🧪 ETH Shamir Test Runner

Usage: node scripts/test.js [test-type]

Available test types:
  unit        - Run unit tests only
  e2e         - Run end-to-end tests only  
  performance - Run performance tests only
  all         - Run all tests (default)

Examples:
  node scripts/test.js           # Run all tests
  node scripts/test.js unit      # Run unit tests only
  node scripts/test.js e2e       # Run E2E tests only
  node scripts/test.js performance # Run performance tests only

Environment variables:
  CI=true      - Run in CI mode (no watch mode)
  COVERAGE=true - Generate coverage report
`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0];

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

if (testType && !testTypes[testType]) {
    console.error(`\n❌ Unknown test type: ${testType}\n`);
    showHelp();
    process.exit(1);
}

// Set environment variables for CI
if (process.env.CI) {
    process.env.CI = 'true';
}

if (process.env.COVERAGE) {
    process.env.COVERAGE = 'true';
}

runTests(testType);
