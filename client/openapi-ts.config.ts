import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "openapi.json",
  output: "src/client",
  name: "PixalJudgeApi",
  useOptions: true,
});