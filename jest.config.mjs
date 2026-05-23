/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true }],
    "^.+\\.mjs$": ["ts-jest", { useESM: true, tsconfig: { allowJs: true } }],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "postinstall.mjs",
  ],
  coverageDirectory: "coverage",
}

export default config
