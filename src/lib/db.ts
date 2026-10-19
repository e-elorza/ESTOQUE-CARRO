import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __sql?: Sql };

function create(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const local = /@(localhost|127\.0\.0\.1)[:/]|host=\/|@\/|\?host=/.test(url);
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // Transaction-mode poolers (e.g. Supabase port 6543) do not support prepared statements.
    prepare: false,
    // Nor pipelining: with several in-flight queries per connection, Supavisor can hand
    // one query's result to another (seen as empty count(*) results on the dashboard).
    // 0 = one query in flight per connection (1 still allows two). Missing from the types.
    ...({ max_pipeline: local ? 100 : 0 } as object),
    ssl: local ? false : "require",
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

/** Shared connection pool, or null when DATABASE_URL is not set (demo mode). */
export const sql: Sql | null = globalForDb.__sql ?? create();
if (process.env.NODE_ENV !== "production" && sql) globalForDb.__sql = sql;

export function requireSql(): Sql {
  if (!sql) throw new Error("DATABASE_URL não configurada.");
  return sql;
}

export const hasDatabase = Boolean(sql);
