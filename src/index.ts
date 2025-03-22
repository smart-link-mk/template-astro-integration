import type { AstroIntegration } from "astro";
import { Liquid } from "liquidjs";
import lodashSet from "lodash.set";
import { readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { apply } from "walkjs";
import AdmZip from "adm-zip";
import { Client } from "@smart-link-mk/api-client-sdk";
import type { JSONSchema4 } from "json-schema";
import { compile } from "json-schema-to-typescript";

export default function createPlugin(params: {
  schema: JSONSchema4;
  apiKey: string;
  name: string;
  version: string;
  config: import("@SmartLinkTypes").RawContext;
}): AstroIntegration {
  const { schema, apiKey, name, version, config } = params;

  const smartLinkClient = new Client({
    apiKey,
  });

  const liquid = new Liquid();
  return {
    name: "smart-link",
    hooks: {
      "astro:config:setup": async ({ updateConfig, command }) => {
        if (command == "build") {
          apply(config, (node) => {
            if (
              typeof node.val === "string" ||
              typeof node.val === "number" ||
              typeof node.val === "boolean"
            ) {
              const p = node.getPath(
                (node) => node.key + (node.children.length ? "." : "")
              );
              lodashSet(config as any, p, `{{ context.${p} }}`);
            }
          });
        }
        updateConfig({
          trailingSlash: "never",
          base:
            command == "build"
              ? `https://templates.smartlink.mk/${
                  (await smartLinkClient.user.me()).userId
                }/${name}/${version}/`
              : undefined,
          vite: {
            plugins: [
              {
                name: "smart-link",
                enforce: "post",
                transform(code, id) {
                  if (
                    id.endsWith(".astro") ||
                    id.endsWith("/template-astro-integration/src/context.ts")
                  ) {
                    const c = liquid.parseAndRenderSync(code, {
                      context: JSON.parse(
                        JSON.stringify(config, (key, val) => {
                          if (typeof val != "string") return val;
                          return val
                            .replace(/[\\]/g, "\\\\")
                            .replace(/[\/]/g, "\\/")
                            .replace(/[\b]/g, "\\b")
                            .replace(/[\f]/g, "\\f")
                            .replace(/[\n]/g, "\\n")
                            .replace(/[\r]/g, "\\r")
                            .replace(/[\t]/g, "\\t")
                            .replace(/[\"]/g, '\\"')
                            .replace(/\\'/g, "\\'");
                        })
                      ),
                      templateBaseUrl: ".",
                    });
                    return c;
                  }

                  return null;
                },
              },
            ],
          },
        });
      },
      "astro:build:done": async ({ dir, logger }) => {
        const oldName = fileURLToPath(new URL("./index.html", dir));
        const newName = fileURLToPath(new URL("./index.liquid", dir));
        await rename(oldName.toString(), newName.toString());

        const fileContents = await readFile(newName, "utf8");
        await writeFile(newName, fileContents.replaceAll('\"/http', '\"http'));

        const shouldPublish = process.argv.includes("--publish");
        if (shouldPublish) {
          logger.info(`Publishing template ${name} version ${version}`);
          const zip = new AdmZip();

          zip.addLocalFolder(dir.pathname);

          const buffer = await zip.toBufferPromise();
          const blob = new Blob([buffer]);

          const template =
            await smartLinkClient.templates.assertTemplateExists(name);

          try {
            await smartLinkClient.templates.uploadVersion({
              name: template.name,
              version,
              zip: blob,
              jsonSchema: schema as any,
            });
            logger.info(`Template ${name} version ${version} published`);
          } catch (e) {
            if ((e as any).response.status == 409) {
              logger.error(`Version ${version} already exists`);
            } else {
              logger.error("Failed to publish template");
            }
          }
        }
      },
      "astro:config:done": async ({ injectTypes }) => {
        let generated = await compile(schema as JSONSchema4, "rawContext", {
          additionalProperties: false,
        });
        generated += `\ntype PrimitiveToString<T> = T extends string | number | boolean | bigint | symbol | null | undefined
  ? string
  : T extends object
  ? { [K in keyof T]: PrimitiveToString<T[K]> }
  : T;\n\nexport type Context = PrimitiveToString<RawContext>;`;
        injectTypes({ filename: "index.d.ts", content: generated });
      },
    },
  };
}
