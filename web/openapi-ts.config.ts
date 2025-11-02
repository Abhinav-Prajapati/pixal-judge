import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: {
    format: "prettier",
    path: "./client",
  },
  plugins: [
    "@hey-api/schemas",
    {
      name: "@hey-api/typescript",
    },
    {
      name: "@hey-api/sdk",
    },
    "@tanstack/react-query",
  ],
});
