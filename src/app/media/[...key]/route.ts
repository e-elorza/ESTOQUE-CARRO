import { readLocal, storageDriver } from "@/lib/storage";

/** Serves photos stored on local disk (development). In production photos come from S3. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (storageDriver !== "local") return new Response(null, { status: 404 });
  const key = (await params).key.join("/");
  let file: Buffer | null = null;
  try {
    file = await readLocal(key);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": key.endsWith(".webp")
        ? "image/webp"
        : "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
