/**
 * Photo storage behind a tiny interface so the host can change without touching callers.
 *
 * - "s3": any S3-compatible bucket (Supabase Storage, Cloudflare R2, AWS S3...). Use in production.
 * - "local": files on disk, served by /media/[...key]. Development only; serverless disks are ephemeral.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  publicUrl(key: string): string;
}

const localDir = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "storage");

export function safeKey(key: string): string {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes(".."))
    throw new Error("Chave de arquivo inválida.");
  return key;
}

const local: Storage = {
  async put(key, body) {
    const file = path.join(localDir, safeKey(key));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  },
  async remove(keys) {
    await Promise.all(
      keys.map((k) => rm(path.join(localDir, safeKey(k)), { force: true })),
    );
  },
  publicUrl: (key) => `/media/${key}`,
};

export async function readLocal(key: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(localDir, safeKey(key)));
  } catch {
    return null;
  }
}

function s3(): Storage {
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET!;
  const publicBase = (
    process.env.S3_PUBLIC_URL ?? `${endpoint}/${bucket}`
  ).replace(/\/$/, "");
  const client = new AwsClient({
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    region: process.env.S3_REGION ?? "auto",
    service: "s3",
  });
  const objectUrl = (key: string) => `${endpoint}/${bucket}/${safeKey(key)}`;
  return {
    async put(key, body, contentType) {
      const res = await client.fetch(objectUrl(key), {
        method: "PUT",
        body: new Uint8Array(body),
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
      if (!res.ok) throw new Error(`Falha ao enviar arquivo (${res.status}).`);
    },
    async remove(keys) {
      await Promise.all(
        keys.map((k) => client.fetch(objectUrl(k), { method: "DELETE" })),
      );
    },
    publicUrl: (key) => `${publicBase}/${key}`,
  };
}

export const storageDriver: "s3" | "local" =
  process.env.S3_ENDPOINT && process.env.S3_BUCKET ? "s3" : "local";
export const storage: Storage = storageDriver === "s3" ? s3() : local;
