module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>'], // Process files in the backend's root directory
    testMatch: [ // Look for test files specifically
        "**/__tests__/**/*.test.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)"
    ],
    // Automatically clear mock calls and instances between every test
    clearMocks: true,
    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",
    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,
    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        '**/*.js',
        '!jest.config.js', // Don't include the config itself
        '!**/node_modules/**',
        '!**/coverage/**',
        '!./db.js', // Often db connection modules are tricky to test or cause open handles
        // Add other files or patterns to exclude if necessary
    ],
    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: [
        "json",
        "text",
        "lcov",
        "clover"
    ],
    // Setup files to run before each test file
    setupFilesAfterEnv: ['./jest.setup.js'], // if you have a setup file
    // Module file extensions for importing
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    // Ignore specific paths
    modulePathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/pdfs/"
    ],
    // Test path ignore patterns
    testPathIgnorePatterns: [
        "/node_modules/",
        "/pdfs/"
    ],
    // Transform files with babel-jest
    transform: {
        '^.+\.js$': 'babel-jest',
    },
};
