import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "maplibre");
mkdirSync(outDir, { recursive: true });
copyFileSync(
  join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
  join(outDir, "maplibre-gl-worker.mjs"),
);
