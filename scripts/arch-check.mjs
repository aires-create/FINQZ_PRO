import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_TSX = path.join(ROOT, "src", "App.tsx");
const DIST_ASSETS = path.join(ROOT, "dist", "assets");
const BUNDLE_BUDGET_BYTES = 420 * 1024;

const failures = [];

const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const checkAppLazyLoadingGovernance = () => {
  const source = readText(APP_TSX);
  const directPageImportPattern =
    /import\s+(?!type\b)[^;]*from\s+["']\.\/pages\/[^"']+["'];?/g;
  const matches = source.match(directPageImportPattern) ?? [];

  if (matches.length > 0) {
    failures.push(
      `App.tsx contains direct page imports (must be lazy):\n${matches.join("\n")}`,
    );
  }
};

const checkMainBundleBudget = () => {
  if (!fs.existsSync(DIST_ASSETS)) {
    failures.push("Missing dist/assets. Run `npm run build` before `npm run arch:check`.");
    return;
  }

  const files = fs
    .readdirSync(DIST_ASSETS)
    .filter((name) => /^index-.*\.js$/.test(name))
    .map((name) => {
      const filePath = path.join(DIST_ASSETS, name);
      return { name, size: fs.statSync(filePath).size };
    });

  if (files.length === 0) {
    failures.push("No index-*.js found in dist/assets.");
    return;
  }

  const main = files.sort((a, b) => b.size - a.size)[0];
  if (main.size > BUNDLE_BUDGET_BYTES) {
    failures.push(
      `Main bundle budget exceeded: ${main.name} = ${main.size} bytes (limit ${BUNDLE_BUDGET_BYTES}).`,
    );
  }
};

checkAppLazyLoadingGovernance();
checkMainBundleBudget();

if (failures.length > 0) {
  console.error("Architecture governance check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Architecture governance check passed.");
