const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.resolve(__dirname, "ai-functions");
const REPO_DIR = path.resolve(ROOT_DIR, "features");
const TARGET_BUNDLE_PATH = path.resolve(__dirname, "ai-functions.js");

const ORDERED_FILES = [
  "utilities.js",
  "getRequestInfo.js",
  "getTargetRoute.js",
  "setPrompt.js",
  "getResponse.js",
  "setResponse.js",
  "getUsageData.js",
  "testAllowedModels.js",
  "testDeniedModels.js",
  "convertOpenAiToGemini.js",
  "convertGeminiToOpenAi.js",
  "convertOpenAiToGeminiAudio.js",
  "convertGeminiAudioToOpenAi.js",
  "parseMultipartFormData.js",
  "convertOpenAiMultipartToGemini.js",
  "convertOpenAiToGeminiEmbeddings.js",
  "convertGeminiEmbeddingsToOpenAi.js",
  "convertOpenAiToImagen.js",
  "convertOpenAiToGeminiImage.js",
  "convertImagenToOpenAi.js",
  "convertOpenAiToAnthropic.js",
  "convertAnthropicToOpenAi.js",
  "convertAnthropicStreamToOpenAi.js",
  "convertOpenAiPayload.js",
  "getModelTokenLimit.js",
  "getModelList.js"
];

const EXPORTED_NAMES = [
  "getRequestInfo",
  "getModelName",
  "getTargetRoute",
  "getPrompts",
  "setPrompt",
  "getResponse",
  "setResponse",
  "getUsageData",
  "testAllowedModels",
  "testDeniedModels",
  "encodeBytesToBase64",
  "parseMultipartFormData",
  "convertOpenAiMultipartToGemini",
  "convertOpenAiToGeminiEmbeddings",
  "convertGeminiEmbeddingsToOpenAi",
  "convertOpenAiToGemini",
  "convertOpenAiToGeminiAudio",
  "convertGeminiAudioToOpenAi",
  "decodeBase64ToBytes",
  "convertOpenAiPayload",
  "convertGeminiToOpenAi",
  "convertOpenAiToImagen",
  "convertOpenAiToGeminiImage",
  "convertImagenToOpenAi",
  "convertOpenAiToAnthropic",
  "convertAnthropicToOpenAi",
  "convertAnthropicStreamToOpenAi",
  "getModelTokenLimit",
  "getModelList"
];

function cleanFunctionCode(code) {
  // Remove top-level require blocks
  let cleaned = code.replace(/if\s*\(\s*typeof\s+require\s*!==\s*["']undefined["']\s*\)\s*\{[\s\S]*?\n\}/g, "");
  // Remove var x = typeof x ... require line if any
  cleaned = cleaned.replace(/var\s+\w+\s*=\s*typeof\s+\w+\s*!==\s*["']undefined["'][\s\S]*?;\n?/g, "");
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

function syncToRepositoryYaml(bundleCode) {
  if (!fs.existsSync(REPO_DIR)) return;

  const yamlFiles = fs.readdirSync(REPO_DIR).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));
  const indentedBundle = bundleCode.trimEnd().split("\n").map(line => line.length > 0 ? "      " + line : "").join("\n");

  const resourceRegex = /((\r?\n|^)[ \t]*-[ \t]*name:[ \t]*ai-functions\.js[ \t]*\r?\n[ \t]*type:[ \t]*jsc[ \t]*\r?\n[ \t]*content:[ \t]*\|[ \t]*\r?\n)(?:(?:[ \t]{6,}.*|[ \t]*)\r?\n)*(?=(?:[ \t]{0,4}\S|$))/g;

  for (const file of yamlFiles) {
    const yamlPath = path.join(REPO_DIR, file);
    const content = fs.readFileSync(yamlPath, "utf-8");

    if (resourceRegex.test(content)) {
      console.log(`Updating ${file} with synced ai-functions.js...`);
      resourceRegex.lastIndex = 0;
      const updated = content.replace(resourceRegex, `$1${indentedBundle}\n`);
      fs.writeFileSync(yamlPath, updated, "utf-8");
    }
  }
}

function main() {
  console.log("Generating bundled ai-functions.js...");
  const bundle = generateBundle();
  fs.writeFileSync(TARGET_BUNDLE_PATH, bundle, "utf-8");
  console.log(`Wrote bundled code to ${TARGET_BUNDLE_PATH} (${bundle.length} bytes)`);

  console.log("Syncing bundle to repository feature YAMLs...");
  syncToRepositoryYaml(bundle);
  console.log("Sync complete!");
}

if (require.main === module) {
  main();
}

module.exports = { generateBundle, syncToRepositoryYaml };
