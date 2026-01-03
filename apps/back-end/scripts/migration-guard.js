// Lightweight migration guard: warn if duplicate CREATE TABLE detected in migrations
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const tableMap = {};
let hasDuplicates = false;

for (const migration of fs.readdirSync(migrationsDir)) {
  const sqlPath = path.join(migrationsDir, migration, 'migration.sql');
  if (!fs.existsSync(sqlPath)) continue;
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const matches = [...sql.matchAll(/create table\s+"([^"]+)"/gi)];
  for (const [, table] of matches) {
    if (!tableMap[table]) tableMap[table] = [];
    tableMap[table].push(migration);
    if (tableMap[table].length > 1) hasDuplicates = true;
  }
}

for (const [table, migrations] of Object.entries(tableMap)) {
  if (migrations.length > 1) {
    console.warn(`WARNING: Table '${table}' created in multiple migrations: ${migrations.join(', ')}`);
  }
}

if (hasDuplicates) {
  console.warn('Migration guard: duplicate table creation detected. Review migrations for accidental re-creation.');
  // Do not exit with error (yet)
}
