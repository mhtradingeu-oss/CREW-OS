module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@mh-os/shared(.*)$": "<rootDir>/../../packages/shared/dist$1"
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
};
