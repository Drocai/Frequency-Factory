/**
 * Pre-compile Vercel serverless functions with esbuild.
 *
 * Vercel's ncc bundler fails on the project's tsconfig settings
 * (allowImportingTsExtensions + moduleResolution:"bundler").
 * We pre-bundle each function into a self-contained ESM file,
 * then overwrite the original .ts source in-place. Since JS is
 * valid TS, ncc can re-process the file without TS errors.
 */
import { execSync } from "child_process";
import { renameSync } from "fs";

const functions = [
  "api/trpc/[trpc].ts",
  "api/oauth/callback.ts",
];

for (const entry of functions) {
  const tmp = entry.replace(/\.ts$/, ".tmp.js");
  console.log(`Bundling ${entry} ...`);
  execSync(
    `npx esbuild "${entry}" --bundle --platform=node --format=esm --outfile="${tmp}" --external:@vercel/node --banner:js="import{createRequire as ___cr}from'module';const require=___cr(import.meta.url);"`,
    { stdio: "inherit" }
  );
  renameSync(tmp, entry);
  console.log(`  -> ${entry} (overwritten with bundled JS)`);
}

console.log("API functions pre-compiled successfully.");
