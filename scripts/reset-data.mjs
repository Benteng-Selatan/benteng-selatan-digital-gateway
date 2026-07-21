import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
await copyFile(resolve(root, "data/site-data.seed.json"), resolve(root, "data/site-data.json"));
console.log("Data CMS dikembalikan ke data awal.");
