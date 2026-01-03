// RBAC seeder for MH-OS — JavaScript runtime, code-driven, idempotent

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

// ------------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// absolute path → Crewos/apps/back-end/src/modules
const ROUTES_DIR = path.join(__dirname, "../apps/back-end/src/modules");

const PERMISSION_REGEX = /requirePermission\s*\(\s*([\s\S]*?)\s*\)/g;

const ALIAS_MAP = {
  "support:manage": "support:update",
};

const CORE_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "VIEWER"];

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
function normalizePermissionCode(code) {
  if (!code) return code;
  const sanitized = code.includes(".") ? code.replace(/\./g, ":") : code;
  return ALIAS_MAP[sanitized] || sanitized;
}

function extractPermissionLiterals(arg) {
  try {
    // eslint-disable-next-line no-eval
    const val = eval(arg);
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === "string") return [val];
  } catch {}
  return [arg.replace(/^['"]|['"]$/g, "")];
}

function getAllRouteFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllRouteFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".routes.ts")) {
      files.push(full);
    }
  }
  return files;
}

function codeHasAny(code, keywords) {
  return keywords.some((kw) => code.includes(kw));
}

// ------------------------------------------------------------------
// MAIN
// ------------------------------------------------------------------
async function main() {
  // --------------------------------------------------------------
  // PHASE 1.1 — Extract permissions from routes
  // --------------------------------------------------------------
  const routeFiles = getAllRouteFiles(ROUTES_DIR);
  const found = new Set();

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = PERMISSION_REGEX.exec(content))) {
      const arg = match[1].trim();
      const perms = extractPermissionLiterals(arg);
      perms.forEach((p) => found.add(normalizePermissionCode(p)));
    }
  }

  const permissions = Array.from(found).filter(Boolean).sort();

  // --------------------------------------------------------------
  // PHASE 1.2 — Seed Permission table
  // --------------------------------------------------------------
  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // --------------------------------------------------------------
  // PHASE 1.3 — Seed core roles
  // --------------------------------------------------------------
  for (const name of CORE_ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // --------------------------------------------------------------
  // PHASE 1.4 — Role ↔ Permission mapping (ID-based)
  // --------------------------------------------------------------
  const allRoles = await prisma.role.findMany();
  const allPerms = await prisma.permission.findMany();

  const roleByName = new Map(allRoles.map((r) => [r.name, r]));
  const permByCode = new Map(allPerms.map((p) => [p.code, p]));

  const destructive = ["delete", "remove", "reject"];
  const readOnly = ["read", "list", "export", "view", "get"];
  const updateLike = [
    "update",
    "edit",
    "assign",
    "approve",
    "import",
    "adjust",
    "run",
    "execute",
    "send",
    "create",
    "manage",
    "mark",
    "summarize",
  ];

  async function grant(roleName, code) {
    const role = roleByName.get(roleName);
    const perm = permByCode.get(code);
    if (!role || !perm) return;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: perm.id,
      },
    });
  }

  // SUPER_ADMIN → all
  for (const code of permissions) {
    await grant("SUPER_ADMIN", code);
  }

  // ADMIN → all except destructive
  for (const code of permissions) {
    if (!codeHasAny(code, destructive) || code === "users:delete") {
      await grant("ADMIN", code);
    }
  }

  // OPERATOR → read + update-like
  for (const code of permissions) {
    if (codeHasAny(code, readOnly) || codeHasAny(code, updateLike)) {
      await grant("OPERATOR", code);
    }
  }

  // VIEWER → read-only
  for (const code of permissions) {
    if (codeHasAny(code, readOnly)) {
      await grant("VIEWER", code);
    }
  }

  console.log(
    `RBAC seeded successfully:
     - Permissions: ${permissions.length}
     - Roles: ${CORE_ROLES.length}`
  );

  await prisma.$disconnect();
}

// ------------------------------------------------------------------
main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
