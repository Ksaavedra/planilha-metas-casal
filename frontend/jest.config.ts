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

  transform: {
    '^.+\\.(ts|mjs|js|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: true,
        stringifyContentPathRegex: '\\.(html|svg)$', // <- inline HTML/SVG
      },
    ],
  },

  // Somente .ts aqui
  extensionsToTreatAsEsm: ['.ts'],

  moduleFileExtensions: ['ts', 'html', 'js', 'mjs', 'json'],

  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs|tslib|ngx-echarts|echarts)/)',
  ],

  testEnvironmentOptions: {
    customExportConditions: ['node', 'jest', 'browser'],
  },

  // (opcional) se algum estilo escapar do strip-styles, faça um stub:
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/style.stub.js',
    '^echarts$': '<rootDir>/__mocks__/echarts.ts',
  },
};

export default config;
