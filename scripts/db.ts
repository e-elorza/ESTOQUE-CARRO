import postgres from "postgres";

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Defina DATABASE_URL (veja .env.example).");
    process.exit(1);
  }
  const local = /@(localhost|127\.0\.0\.1)[:/]|host=\//.test(url);
  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: local ? false : "require",
    onnotice: () => {},
  });
}
