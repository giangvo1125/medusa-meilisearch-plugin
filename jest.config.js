module.exports = {
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/__jest__/setup.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/?(*.)(spec|test).ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.(interface|constant|model|enum|type).{ts,js}",
    "!**/__mocks__/**",
    "!**/node_modules/**",
    "!src/server.ts",
    "!src/**/*.validator.{ts,js}",
    "!src/**/*.route.{ts,js}",
    "!src/routes.{ts,js}",
    "!src/**/index.{ts,js}",
    "!src/healthCheck/**",
    "!src/**/*.plugin.{ts,js}",
  ],
};
