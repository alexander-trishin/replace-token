/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    verbose: true,
    clearMocks: true,

    moduleFileExtensions: ['js', 'ts'],

    transform: {
        '^.+\\.ts$': 'ts-jest'
    },

    testMatch: ['**/*.test.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],

    collectCoverage: true,
    collectCoverageFrom: ['./src/**'],
    coverageReporters: ['json-summary', 'text', 'lcov']
};

export default config;
