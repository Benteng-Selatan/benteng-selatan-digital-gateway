import { del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const [{ db, sql }, { pendingUploads }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
  ]);

  const token = process.env.CITIZEN_BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("CITIZEN_BLOB_READ_WRITE_TOKEN belum tersedia.");

  const retentionDays = Number(process.env.PENDING_UPLOAD_RETENTION_DAYS || "7");
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
    throw new Error("PENDING_UPLOAD_RETENTION_DAYS harus berupa bilangan bulat 1 sampai 365.");
  }
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const candidates = await db
    .select()
    .from(pendingUploads)
    .where(and(
      isNull(pendingUploads.submissionId),
      inArray(pendingUploads.status, ["pending", "rejected"]),
      lt(pendingUploads.createdAt, cutoff)
    ));

  console.log(`Berkas kandidat: ${candidates.length}`);
  console.log(`Batas usia: lebih dari ${retentionDays} hari`);
  if (process.env.CONFIRM_DELETE_PENDING_UPLOADS !== "YES_DELETE_ABANDONED_UPLOADS") {
    console.log("DRY RUN. Tidak ada berkas dihapus.");
    console.log("Set CONFIRM_DELETE_PENDING_UPLOADS=YES_DELETE_ABANDONED_UPLOADS hanya setelah target database dan Blob store dipastikan benar.");
    return;
  }

  let deleted = 0;
  for (const row of candidates) {
    await del(row.privateUrl, { token });
    const removed = await db.delete(pendingUploads)
      .where(and(isNull(pendingUploads.submissionId), inArray(pendingUploads.status, ["pending", "rejected"]), lt(pendingUploads.createdAt, cutoff), eq(pendingUploads.id, row.id)))
      .returning({ id: pendingUploads.id });
    if (!removed.length) continue;
    deleted += 1;
    await sql`INSERT INTO audit_logs (
      id, actor_username, actor_name, actor_role, action, entity_type, entity_id,
      metadata, ip_address, user_agent, created_at
    ) VALUES (
      ${randomUUID()}, 'maintenance', 'Maintenance Script', 'system',
      'citizen.upload_abandoned_deleted', 'pending_upload', ${row.id},
      ${JSON.stringify({ status: row.status, retentionDays, contentType: row.contentType, size: row.size })}::jsonb,
      'local-maintenance', 'cleanup-pending-uploads', now()
    )`;
  }
  console.log(`Berkas terhapus: ${deleted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
