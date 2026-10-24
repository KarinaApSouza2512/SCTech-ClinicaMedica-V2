/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // src entra para que um service sem nenhum teste conte como 0% na cobertura
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  // Cobertura medida so na camada de regra de negocio
  collectCoverageFrom: ['src/services/**/*.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
};
