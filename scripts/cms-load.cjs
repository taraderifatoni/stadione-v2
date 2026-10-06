// Trusted VPS CLI adapter only; application requests use Next's normal module loader.
const fs = require("node:fs"), path = require("node:path"), Module = require("node:module"), ts = require("typescript");
const root = path.resolve(__dirname, "..");
require.extensions[".ts"] = (m, filename) => {
  const source = fs.readFileSync(filename, "utf8").replace(/^import ["']server-only["'];?\s*$/gm, "")
    .replace(/(["'])@\/([^"']+)\1/g, (_, quote, name) => quote + path.join(root, "src", name) + quote);
  m.paths = Module._nodeModulePaths(root);
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
module.exports = file => require(path.join(root, file));
