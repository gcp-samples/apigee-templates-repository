const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.resolve(__dirname, "oas");
const REPO_DIR = path.resolve(ROOT_DIR, "features");
const TARGET_BUNDLE_PATH = path.resolve(__dirname, "oas-validator.js");

const ORDERED_FILES = [
  "refResolver.js",
  "schemaValidator.js",
  "pathMatcher.js",
  "paramValidator.js",
  "validateOasRequest.js",
  "validateApigeeRequest.js"
];

const EXPORTED_NAMES = [
  "resolveJsonPointer",
  "resolveSchemaRef",
  "validateSchema",
  "getType",
  "deepEqual",
  "matchOasPath",
  "normalizePath",
  "getServerPrefixes",
  "coerceValue",
  "validateParameters",
  "getHeaderCaseInsensitive",
  "validateOasRequest",
  "parseJsonSafe",
  "getContentType",
  "findMatchingMediaType",
  "validateApigeeRequest",
  "parseQueryString"
];

function cleanFunctionCode(code) {
  // Remove top-level require blocks
  let cleaned = code.replace(/if\s*\(\s*typeof\s+require\s*!==\s*["']undefined["']\s*\)\s*\{[\s\S]*?\n\}/g, "");
  // Remove export blocks
  cleaned = cleaned.replace(/if\s*\(\s*typeof\s+exports\s*!==\s*["']undefined["']\s*\)\s*\{[\s\S]*?\n\}/g, "");
  return cleaned.trim();
}

function generateBundle() {
  const parts = [];

  for (const filename of ORDERED_FILES) {
    const filePath = path.join(SRC_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${filename} does not exist at ${filePath}`);
      continue;
    }
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const cleaned = cleanFunctionCode(rawContent);
    if (cleaned) {
      parts.push(cleaned);
    }
  }

  const exportStatements = EXPORTED_NAMES.map(name => `  exports.${name} = ${name};`).join("\n");
  const exportsBlock = `if (typeof exports !== "undefined") {\n${exportStatements}\n}`;
  parts.push(exportsBlock);

  return parts.join("\n\n") + "\n";
}

function syncToYamlFiles(bundleCode) {
  if (!fs.existsSync(REPO_DIR)) {
    return;
  }

  const yamlFiles = fs.readdirSync(REPO_DIR).filter(file => file.endsWith(".yaml") || file.endsWith(".yml"));
  const indentedCode = bundleCode
    .split("\n")
    .map(line => (line.length > 0 ? "      " + line : ""))
    .join("\n");

  for (const file of yamlFiles) {
    const fullPath = path.join(REPO_DIR, file);
    let content = fs.readFileSync(fullPath, "utf-8");

    if (content.includes("oas-validator.js")) {
      const resourceRegex = /(- name:\s*oas-validator\.js\s*\n\s*type:\s*jsc\s*\n\s*content:\s*\|)\n[\s\S]*?(?=\n(?:\s*-\s*name:|\s*tests:|$))/;
      if (resourceRegex.test(content)) {
        console.log(`Updating ${file} with synced oas-validator.js...`);
        content = content.replace(resourceRegex, `$1\n${indentedCode}`);
        fs.writeFileSync(fullPath, content, "utf-8");
      }
    }
  }
}

function main() {
  console.log("Generating OAS Validator ES5 bundle...");
  const bundleContent = generateBundle();
  fs.writeFileSync(TARGET_BUNDLE_PATH, bundleContent, "utf-8");
  console.log(`Successfully generated ${TARGET_BUNDLE_PATH} (${bundleContent.length} bytes)`);

  console.log("Syncing OAS bundle to feature YAMLs...");
  syncToYamlFiles(bundleContent);
  console.log("OAS sync complete!");
}

if (require.main === module) {
  main();
}

module.exports = {
  generateBundle,
  syncToYamlFiles,
  main
};
