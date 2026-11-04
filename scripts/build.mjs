import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("extension/manifest.json", root), "utf8"));

for (const browser of ["chrome", "firefox"]) {
  const destination = new URL(`dist/${browser}/`, root);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(new URL("extension/", root), destination, { recursive: true });
  const output = structuredClone(manifest);
  if (browser === "firefox") {
    delete output.minimum_chrome_version;
    output.background = { scripts: ["background.js"], type: "module" };
    output.browser_specific_settings = {
      gecko: {
        id: "whatsapp-mesma-aba@local.extension",
        strict_min_version: "142.0",
        data_collection_permissions: { required: ["none"] }
      }
    };
  }
  await writeFile(new URL("manifest.json", destination), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Extensão pronta em dist/${browser}`);
}
