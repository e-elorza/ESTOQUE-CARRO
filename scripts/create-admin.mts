/**
 * Creates a staff account and prints a temporary password (shown once).
 * Usage: npm run admin:create -- email@loja.com.br "Nome Sobrenome"
 */
import { hashPassword, temporaryPassword } from "../src/lib/auth/password";
import { connect } from "./db";

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();
if (!email || !email.includes("@") || !name) {
  console.error(
    'Uso: npm run admin:create -- email@loja.com.br "Nome Sobrenome"',
  );
  process.exit(1);
}

const sql = connect();
const password = process.env.ADMIN_PASSWORD ?? temporaryPassword();
const hash = await hashPassword(password);
const [row] = await sql<{ id: string }[]>`
  insert into staff (email, name, password_hash, must_change_password)
  values (${email.toLowerCase()}, ${name}, ${hash}, ${!process.env.ADMIN_PASSWORD})
  on conflict (email) do update set password_hash = excluded.password_hash, must_change_password = excluded.must_change_password
  returning id`;
await sql`delete from sessions where staff_id = ${row.id}`;
console.log(`Acesso criado para ${email.toLowerCase()}.`);
if (!process.env.ADMIN_PASSWORD)
  console.log(`Senha temporária (troque no primeiro acesso): ${password}`);
await sql.end();
