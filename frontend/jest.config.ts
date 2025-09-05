const esModule = [
  '@angular',
  '@ngrx',
  'd3',
  '@ngx-translate',
  '@ds',
  'angular2-text-mask',
];

module.exports = {
  verbose: true,
  preset: 'jest-preset-angular',
  globalSetup: '',
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  reporters: ['default'],
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  coveragePathIgnorePatterns: [
    'setup-jest.ts',
    'public_api.ts',
    'module.ts',
    'interfaces.ts',
    'utils.ts',
    'models.ts',
    'routing.ts',
    'index.ts',
    'main.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!.\\.mjs$|${esModule.join('|')})`,
  ],

  testPathIgnorePatterns: [
    '<rootDir>/dist',
    '<rootDir>/node_modules',
    '<rootDir>/cypress/integration',
    '<rootDir>/src/app/code/interfaces',
    '<rootDir>/src/app/store',
    '<rootDir>/src/app/store/models',
    '<rootDir>/src/main.ts',
  ],
  moduleNameMapper: {
    '^/opt/nodejs/(.*)$': '<rootDir>/test/_mocks_/layerMock.js',
    'src(.*)$': '<rootDir>/src$1',
    'code/(.*)$': '<rootDir>/src/app/code/$1',
    'core/components/(.*)$': '<rootDir>/src/app/core/components/$1',
    'core/interces/(.*)$': '<rootDir>/src/app/core/interfaces/$1',
    'core/services/(.*)$': '<rootDir>/src/app/core/services/$1',
    '@ds(.*)$': '<rootDir>/src/app/ds/$1',
    'shared(.*)$': '<rootDir>/src/app/shared/$1',
    'shared/components(.*)$': '<rootDir>/src/app/shared/components/$1',
    'store(.*)$': '<rootDir>/src/app/store/$1',
    'store/models(.*)$': '<rootDir>/src/app/store/models/$1',
    'src/environments(.*)$': '<rootDir>/src/environments/environment.test.ts',
  },
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.{ts|tsx}?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
};
