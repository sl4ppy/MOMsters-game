// Mock PIXI.js for testing
global.HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  destination: {},
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
} as Storage;
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Setup console suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 