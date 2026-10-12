import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(resolve(dist, "server"), { recursive: true });

const assets = [
  ["PAGE", "index.html"],
  ["CSS", "app.css"],
  ["CLIENT", "app.js"],
];
const prelude = assets
  .map(([name, filename]) => {
    const value = readFileSync(resolve(root, "worker", filename), "utf8");
    return `const ${name} = ${JSON.stringify(value)};`;
  })
  .join("\n");
const server = readFileSync(resolve(root, "worker", "server.js"), "utf8");
writeFileSync(resolve(dist, "server", "index.js"), `${prelude}\n${server}`);
console.log("Jogo preparado para publicação.");
