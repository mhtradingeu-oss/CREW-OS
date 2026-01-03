import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.permission.findMany({
    select: { code: true },
    orderBy: { code: "asc" },
  });

  const codes = rows
    .map((r) => r.code)
    .filter(Boolean)
    .map((s) => s.trim())
    .filter(Boolean);

  fs.writeFileSync("permissions.db.txt", codes.join("\n") + "\n", "utf8");
  console.log(`✅ Exported ${codes.length} permissions to permissions.db.txt`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
