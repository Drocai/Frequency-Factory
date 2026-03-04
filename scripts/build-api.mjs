/**
 * Pre-compile Vercel serverless functions with esbuild.
 *
 * Vercel's ncc bundler fails on the project's tsconfig settings
 * (allowImportingTsExtensions + moduleResolution:"bundler").
 * We pre-bundle each function into a self-contained ESM file,
 * then overwrite the original .ts source in-place. Since JS is
 * valid TS, ncc can re-process the file without TS errors.
 */
import { build } from "esbuild";
import { existsSync, renameSync } from "fs";
import { resolve } from "path";

/** Resolve tsconfig path aliases so @shared/* works at bundle time. */
const tsconfigPathsPlugin = {
  name: "tsconfig-paths",
  setup(b) {
    b.onResolve({ filter: /^@shared\// }, args => {
      const rel = args.path.slice("@shared/".length);
      const base = resolve("shared", rel);
      if (existsSync(base + ".ts")) return { path: base + ".ts" };
      if (existsSync(base + "/index.ts")) return { path: base + "/index.ts" };
      return { path: base };
    });
  },
};

const functions = [
  "api/trpc/[trpc].ts",
  "api/oauth/callback.ts",
];

for (const entry of functions) {
  const tmp = entry.replace(/\.ts$/, ".tmp.js");
  console.log(`Bundling ${entry} ...`);
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: tmp,
    external: ["@vercel/node"],
    banner: {
      js: "import{createRequire as ___cr}from'module';const require=___cr(import.meta.url);",
    },
    plugins: [tsconfigPathsPlugin],
  });
  renameSync(tmp, entry);
  console.log(`  -> ${entry} (overwritten with bundled JS)`);
}

console.log("API functions pre-compiled successfully.");
