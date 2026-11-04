import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // new React Compiler rule: syncing state inside an effect still works, it just renders twice.
      // kept as a warning so it's visible and can be cleaned up file by file.
      "react-hooks/set-state-in-effect": "warn",
      // react-hook-form's watch() makes the compiler skip a component — expected, not a bug
      "react-hooks/incompatible-library": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
