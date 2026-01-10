 
 
const { ALL_PERMISSION_CODES } = require("../../core/security/permission-registry");
const fs = require("fs");
const path = require("path");

describe("Permission Registry Canonicalization", () => {
  const SRC = path.resolve(__dirname, "../../modules"); // ⬅️ routes/controllers فقط
  const PERM_REGEX = /requirePermission\(([^)]*)\)/g;
  const STRING_REGEX = /["'`]([a-z0-9:-]+)["'`]/gi;

  function scanUsedPermissions() {
    const files = getAllFiles(SRC, [".ts", ".js", ".mjs"]);
    const used = new Set();

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      let match;

      while ((match = PERM_REGEX.exec(content))) {
        const args = match[1];
        let strMatch;
        while ((strMatch = STRING_REGEX.exec(args))) {
          used.add(strMatch[1]);
        }
      }
    }

    return used;
  }

  it("all permissions used in routes exist in the canonical registry", () => {
    const used = scanUsedPermissions();

    for (const code of used) {
      expect(ALL_PERMISSION_CODES).toContain(code);
    }
  });
});

/**
 * Helpers
 */
function getAllFiles(dir, exts, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file.startsWith(".") || file === "node_modules") continue;

    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, exts, fileList);
    } else if (exts.some(ext => file.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}
