# @smart-link-mk/template-astro-integration

Easily integrate Smart Link's template system into your Astro project with `@smart-link-mk/template-astro-integration`.

## Installation

Install the package using npm or yarn:

```sh
npm install @smart-link-mk/template-astro-integration
# or
yarn add @smart-link-mk/template-astro-integration
```

## Usage

### 1. Add to Astro Config

Modify your `astro.config.mjs` file to include the integration:

```js
import { defineConfig } from 'astro/config';
import smartLinkTemplate from '@smart-link-mk/template-astro-integration';

export default defineConfig({
  integrations: [smartLinkTemplate()],
});
```

### 2. Add TypeScript Path Alias

Modify your `tsconfig.json` to include the following alias:

```json
"paths": {
  "@SmartLinkTypes": ["./.astro/integrations/smart-link"]
}
```

### 3. Necessary Configuration

When adding the integration, you must provide the necessary configuration options in `astro.config.mjs`:

```js
export default defineConfig({
  integrations: [
    smartLinkTemplate({
      apiKey: "<API_KEY>",
      version: "1.0.0",
      name: "smart-link-template-counter-example",
      schema: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          title: {
            type: "string",
            title: "Title",
            description: "The title of the page",
          },
          initialCount: {
            type: "number",
            title: "Initial Count",
            description: "The initial count to start with",
          }
        },
        required: ["initialCount", "title"],
      },
      config: {
        initialCount: 9,
        title: "Smart Link Template Counter Example",
      }
    }),
  ],
});
```

### 4. Using Templates

Once integrated, you can start using Smart Link templates in your Astro project. For example:

```astro
---
import { Counter } from "../components/Counter";
import Layout from "../layouts/Layout.astro";

import "../styles/global.css";

import { context } from "@smart-link-mk/template-astro-integration/context";
---

<Layout>
  <Counter initialCount={context.initialCount} client:load />
</Layout>
```

### 5. Add Publish Script

To streamline the build and deployment process, add the following script to your `package.json`:

```json
"scripts": {
  "publish": "astro build --publish"
}
```

This will publish the template to your Smart Link account after building.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
