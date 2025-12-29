import next from "eslint-config-next";

export default [
  ...next,
  {
    files: ["**/*.{ts,tsx,js,jsx}", "!dist/**", "!node_modules/**"],
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];
