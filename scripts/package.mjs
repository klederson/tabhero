import { cp, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
await mkdir(new URL("artifacts/", root), { recursive: true });
for (const browser of ["chrome", "firefox"]) {
  const path = fileURLToPath(new URL(`artifacts/whatsapp-mesma-aba-${browser}.zip`, root));
  execFileSync("zip", ["-q", "-r", "-FS", path, "."], {
    cwd: fileURLToPath(new URL(`dist/${browser}/`, root))
  });
  console.log(`Pacote criado: artifacts/whatsapp-mesma-aba-${browser}.zip`);
  await cp(new URL(`artifacts/whatsapp-mesma-aba-${browser}.zip`, root), new URL(`artifacts/tabhero-${browser}.zip`, root));
}
execFileSync("zip", ["-q", "-r", "-FS", fileURLToPath(new URL("artifacts/tabhero-brand-kit.zip", root)), "."], {
  cwd: fileURLToPath(new URL("brand/", root))
});
console.log("Kit criado: artifacts/tabhero-brand-kit.zip");
