import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = [".next"];

await Promise.all(
  targets.map(async (rel) => {
    const full = path.join(root, rel);
    await fs.rm(full, { recursive: true, force: true });
  })
);

