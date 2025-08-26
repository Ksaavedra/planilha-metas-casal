module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.html$": "<rootDir>/html-transform.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.module.ts",
    "!src/main.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts",
    "!src/**/index.ts",
    "!src/**/*.d.ts",
    "!src/environments/**",
    "!src/polyfills.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["html", "text", "text-summary", "lcov"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  collectCoverage: true,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
};
