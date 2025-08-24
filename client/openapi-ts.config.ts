import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    format: 'prettier',
    path: './src/client',
  },
  plugins: [
    '@hey-api/schemas',
    {
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
    },
    '@tanstack/react-query',
  ],
});