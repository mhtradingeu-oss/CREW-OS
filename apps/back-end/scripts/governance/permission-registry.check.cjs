/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// 👇 نقرأ المصدر كنص (NOT require)
const registrySource = fs.readFileSync(
  path.resolve(__dirname, "../../src/core/security/permission-registry.ts"),
  "utf8"
);

// Extract ALL_PERMISSION_CODES via regex (static)
const CODE_REGEX = /["'`]([a-z0-9:-]+)["'`]/gi;
const registryCodes = new Set();
let m;
while ((m = CODE_REGEX.exec(registrySource))) {
  registryCodes.add(m[1]);
}

// Scan usage
const SRC = path.resolve(__dirname, "../../src");
const PERM_REGEX = /requirePermission\(([^)]*)\)/g;
const STRING_REGEX = /["'`]([a-z0-9:-]+)["'`]/gi;

function getAllFiles(dir) {
  return fs.readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? getAllFiles(p) : p;
  });
}

const used = new Set();
for (const file of getAllFiles(SRC)) {
  if (!file.endsWith(".ts")) continue;
  const c = fs.readFileSync(file, "utf8");
  let m2;
  while ((m2 = PERM_REGEX.exec(c))) {
    let s;
    while ((s = STRING_REGEX.exec(m2[1]))) {
      used.add(s[1]);
    }
  }
}

// Assertions
for (const code of used) {
  if (!registryCodes.has(code)) {
    console.error("❌ Missing permission in registry:", code);
    process.exit(1);
  }
}

console.log("✅ Permission Registry Governance: PASS");
