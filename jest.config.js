const fs = require("fs");
const tsConfig = require("./tsconfig.json").compilerOptions;

tsConfig.module = "commonjs";
tsConfig.target = "es2015";
tsConfig.types.push("jest");

module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: tsConfig
    }
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": "babel-jest",
    "^.+\\.svelte$": "svelte-jester"
  },
  testMatch: ["**/*.test.(ts|js)"],
  moduleFileExtensions: ["ts", "js", "svelte"],
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"]
};
