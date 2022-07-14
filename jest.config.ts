import type { Config } from "@jest/types";

export default async (): Promise<Config.InitialOptions> => {
  return {
    verbose: true,
    testEnvironment: "node",
    moduleFileExtensions: ["js", "json", "ts"],
    testMatch: ["**/*.spec.ts"],
    transform: {
      "^.+\\.(t|j)s$": "ts-jest",
    },
    moduleNameMapper: {
      "^@/(.*)": "<rootDir>/$1",
    },
    collectCoverageFrom: ["**/*.(t|j)s"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "json", "clover"],
    reporters: ["default", ["jest-junit", { outputDirectory: "../coverage" }]],
  };
};
