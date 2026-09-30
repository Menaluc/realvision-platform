import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.{js,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^next$",
        },]
    }
  }]);



