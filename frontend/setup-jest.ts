// Configurações básicas para testes
import 'zone.js';
import 'zone.js/testing';

// Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para CSS
Object.defineProperty(window, 'CSS', { value: null });

// Mock para getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
  }),
});

// Mock para document.doctype
Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});
