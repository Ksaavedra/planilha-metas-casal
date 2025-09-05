// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: 'jest-preset-angular',
  globalSetup: '',
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'dist/test-results', outputName: 'test.results.xml' },
    ],
    [
      'jest-sonar',
      {
        outputDirectory: 'dist/test-coverage',
        outputName: 'test.reporter.xml',
      },
    ],
  ],
  collectCoverageFrom: ['src/**/*.ts'],

  testRunner: 'jest-jasmine2',
  testMatch: ['**/*.spec.ts'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'mjs', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs|tslib|ngx-echarts|echarts)/)',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'jest', 'browser'],
  },
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/style.stub.js',
    '^ngx-echarts$': '<rootDir>/__mocks__/ngx-echarts.ts',
    '^echarts$': '<rootDir>/__mocks__/echarts.ts',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

export default config;
