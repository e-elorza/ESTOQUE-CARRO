/** Applies db/migrations/*.sql in order, once each. Usage: npm run db:migrate */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect } from "./db";

const sql = connect();
const dir = path.resolve("db/migrations");

await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
const applied = new Set(
  (await sql<{ name: string }[]>`select name from schema_migrations`).map(
    (r) => r.name,
  ),
);
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const body = await readFile(path.join(dir, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  console.log(`aplicada: ${file}`);
}
console.log("Banco atualizado.");
await sql.end();
