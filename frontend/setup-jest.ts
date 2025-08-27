import 'jest-preset-angular/setup-jest';

Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
