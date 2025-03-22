// @ts-check
import { defineConfig } from "astro/config";
import SmartLink from "./src";

export default defineConfig({
  output: "static",
  integrations: [
    SmartLink({
      name: "test-astro-integration",
      version: "1.0.0",
      apiKey: "",
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          initialCount: {
            type: "number",
            title: "Initial Count",
            description: "The initial count to start with",
            default: 0,
          },
        },
      } ,
      config: {
        initialCount: 6
      },
    }),
  ],
});
