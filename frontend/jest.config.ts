// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/environments/**',
    '!src/**/index.ts',
  ],
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
