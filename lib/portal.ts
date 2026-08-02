import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import type { AdminSession } from "@/lib/auth";
import { auditValues, type AuditContext } from "@/lib/audit";
import { getCitizenSession } from "@/lib/citizen-auth";
import { CmsConflictError, getSiteDocument } from "@/lib/cms";
import { db, sql } from "@/lib/db";
import {
  citizenUsers,
  contentSubmissions,
  serviceRequestHistory,
  serviceRequestMessages,
  serviceRequests,
} from "@/lib/db/schema";
import {
  CONTRIBUTION_TYPES,
  type ContributionType,
  PILOT_SERVICE,
  REQUEST_STATUSES,
  type ServiceRequestStatus,
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "@/lib/portal-types";
import { decryptSensitive, encryptSensitive, hashPassword, verifyPassword } from "@/lib/security";
import { assertPendingUploadOwnership, preparePendingUploadPublication, rollbackPendingUploadPromotion } from "@/lib/citizen-uploads";
import type { AdminRole } from "@/lib/admin-permissions";
import { STORY_CATEGORIES, STORY_TYPES, type MapLocation, type SiteData, type StoryItem, type UmkmItem } from "@/lib/types";
import { siteDataValidationErrors } from "@/lib/site-data-validation";

function clean(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safePublicUrl(value: unknown, allowLocalImage = false): string {
  const input = clean(value, 1000);
  if (!input) return "";
  if (allowLocalImage && input.startsWith("/images/")) return input;
  try {
    const parsed = new URL(input);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function numericIdentity(value: string): boolean {
  return /^\d{16}$/.test(value);
}

function shortCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function requestNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BS-SKU-${date}-${shortCode()}`;
}

function submissionNumber(type: ContributionType): string {
  const prefix = type === "umkm" ? "UMKM" : type === "tourism" ? "KBR" : "MAP";
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BS-${prefix}-${date}-${shortCode()}`;
}

export async function registerCitizen(input: Record<string, unknown>) {
  const email = clean(input.email, 180).toLowerCase();
  const password = clean(input.password, 128);
  const fullName = clean(input.fullName, 120);
  const phone = clean(input.phone, 30);
  const address = clean(input.address, 500);

  if (!emailIsValid(email)) throw new Error("Alamat email tidak valid.");
  if (password.length < 8) throw new Error("Kata sandi minimal 8 karakter.");
  if (fullName.length < 3) throw new Error("Nama lengkap wajib diisi.");
  if (phone.length < 8) throw new Error("Nomor telepon/WhatsApp wajib diisi.");
  if (address.length < 10) throw new Error("Alamat domisili wajib diisi dengan jelas.");

  const [existing] = await db.select({ id: citizenUsers.id }).from(citizenUsers).where(eq(citizenUsers.email, email)).limit(1);
  if (existing) throw new Error("Email tersebut sudah terdaftar.");

  const id = randomUUID();
  await db.insert(citizenUsers).values({
    id,
    email,
    passwordHash: hashPassword(password),
    fullName,
    phone,
    address,
    updatedAt: new Date(),
  });

  return { id, email, fullName };
}

export async function authenticateCitizen(emailInput: unknown, passwordInput: unknown) {
  const email = clean(emailInput, 180).toLowerCase();
  const password = clean(passwordInput, 128);
  if (!email || !password) return null;

  const [user] = await db.select().from(citizenUsers).where(eq(citizenUsers.email, email)).limit(1);
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, email: user.email, fullName: user.fullName };
}

export async function getCurrentCitizen() {
  const session = await getCitizenSession();
  if (!session) return null;
  const [user] = await db
    .select({
      id: citizenUsers.id,
      email: citizenUsers.email,
      fullName: citizenUsers.fullName,
      phone: citizenUsers.phone,
      address: citizenUsers.address,
      isActive: citizenUsers.isActive,
    })
    .from(citizenUsers)
    .where(eq(citizenUsers.id, session.userId))
    .limit(1);
  if (!user?.isActive) return null;
  return user;
}

export async function createServiceRequest(citizenId: string, input: Record<string, unknown>, context?: AuditContext) {
  const applicantName = clean(input.applicantName, 120);
  const identityNumber = clean(input.identityNumber, 20);
  const familyCardNumber = clean(input.familyCardNumber, 20);
  const phone = clean(input.phone, 30);
  const address = clean(input.address, 500);
  const businessName = clean(input.businessName, 150);
  const businessType = clean(input.businessType, 120);
  const businessAddress = clean(input.businessAddress, 500);
  const purpose = clean(input.purpose, 500);
  const citizenNote = clean(input.citizenNote, 1000);

  if (applicantName.length < 3) throw new Error("Nama pemohon wajib diisi.");
  if (!numericIdentity(identityNumber)) throw new Error("NIK harus terdiri dari 16 digit.");
  if (familyCardNumber && !numericIdentity(familyCardNumber)) throw new Error("Nomor KK harus terdiri dari 16 digit.");
  if (phone.length < 8 || address.length < 10) throw new Error("Kontak dan alamat pemohon belum lengkap.");
  if (businessName.length < 3 || businessType.length < 3 || businessAddress.length < 10 || purpose.length < 3) {
    throw new Error("Data usaha dan keperluan surat belum lengkap.");
  }

  const id = randomUUID();
  const number = requestNumber();
  const now = new Date();
  const historyId = randomUUID();
  const formData = { businessName, businessType, businessAddress, purpose };
  const [citizen] = await db.select({ email: citizenUsers.email, fullName: citizenUsers.fullName }).from(citizenUsers).where(eq(citizenUsers.id, citizenId)).limit(1);
  const audit = auditValues({
    actorIdentity: { id: citizenId, username: citizen?.email || "citizen", name: citizen?.fullName || applicantName, role: "citizen" },
    action: "request.create",
    entityType: "service_request",
    entityId: id,
    metadata: { requestNumber: number, serviceCode: PILOT_SERVICE.code },
    context,
  });
  await sql.transaction([
    sql`INSERT INTO service_requests (
      id, request_number, citizen_id, service_code, status, applicant_name,
      identity_number_encrypted, family_card_number_encrypted, phone, address,
      form_data, citizen_note, submitted_at, updated_at
    ) VALUES (
      ${id}, ${number}, ${citizenId}, ${PILOT_SERVICE.code}, 'submitted', ${applicantName},
      ${encryptSensitive(identityNumber)}, ${encryptSensitive(familyCardNumber)}, ${phone}, ${address},
      ${JSON.stringify(formData)}::jsonb, ${citizenNote}, ${now}, ${now}
    )`,
    sql`INSERT INTO service_request_history (
      id, request_id, previous_status, new_status, changed_by, note, created_at
    ) VALUES (
      ${historyId}, ${id}, '', 'submitted', ${applicantName}, 'Pengajuan dikirim oleh warga.', ${now}
    )`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
  return { id, requestNumber: number };
}

export async function listCitizenRequests(citizenId: string) {
  const rows = await db.select().from(serviceRequests).where(eq(serviceRequests.citizenId, citizenId)).orderBy(desc(serviceRequests.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    requestNumber: row.requestNumber,
    serviceCode: row.serviceCode,
    serviceName: PILOT_SERVICE.name,
    status: row.status as ServiceRequestStatus,
    applicantName: row.applicantName,
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getCitizenRequest(citizenId: string, requestId: string) {
  const [row] = await db.select().from(serviceRequests).where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.citizenId, citizenId))).limit(1);
  if (!row) return null;
  const messages = await db
    .select()
    .from(serviceRequestMessages)
    .where(and(eq(serviceRequestMessages.requestId, requestId), eq(serviceRequestMessages.isInternal, false)))
    .orderBy(serviceRequestMessages.createdAt);
  const history = await db.select().from(serviceRequestHistory).where(eq(serviceRequestHistory.requestId, requestId)).orderBy(serviceRequestHistory.createdAt);
  return {
    ...row,
    status: row.status as ServiceRequestStatus,
    identityNumber: decryptSensitive(row.identityNumberEncrypted),
    familyCardNumber: decryptSensitive(row.familyCardNumberEncrypted),
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() || null,
    messages: messages.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    history: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function addCitizenMessage(citizenId: string, requestId: string, messageInput: unknown, context?: AuditContext) {
  const message = clean(messageInput, 1500);
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");
  const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.citizenId, citizenId))).limit(1);
  if (!request) throw new Error("Pengajuan tidak ditemukan.");
  const [user] = await db.select({ fullName: citizenUsers.fullName }).from(citizenUsers).where(eq(citizenUsers.id, citizenId)).limit(1);
  const now = new Date();
  const messageId = randomUUID();
  const [citizen] = await db.select({ email: citizenUsers.email, fullName: citizenUsers.fullName }).from(citizenUsers).where(eq(citizenUsers.id, citizenId)).limit(1);
  const audit = auditValues({
    actorIdentity: { id: citizenId, username: citizen?.email || "citizen", name: citizen?.fullName || user?.fullName || "Warga", role: "citizen" },
    action: "request.message_citizen",
    entityType: "service_request",
    entityId: requestId,
    metadata: { messageId },
    context,
  });
  await sql.transaction([
    sql`INSERT INTO service_request_messages (id, request_id, sender_type, sender_label, message, is_internal, created_at)
        VALUES (${messageId}, ${requestId}, 'citizen', ${user?.fullName || "Warga"}, ${message}, false, ${now})`,
    sql`UPDATE service_requests SET updated_at=${now} WHERE id=${requestId}`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
}

function submissionTitle(type: ContributionType, payload: Record<string, string | number | boolean | null>): string {
  return String(type === "umkm" ? payload.name : type === "tourism" ? payload.title : payload.name || "Pengajuan warga");
}

export async function createContentSubmission(
  citizenId: string,
  input: Record<string, unknown>,
  context?: AuditContext
) {
  const type = clean(input.type, 20) as ContributionType;
  if (!CONTRIBUTION_TYPES.includes(type)) throw new Error("Jenis kontribusi tidak valid.");

  const payload: Record<string, string | number | boolean | null> = {};
  let linkedUploadId: string | null = null;
  const requestedImage = clean(input.image, 1000);

  if (type === "umkm") {
    payload.name = clean(input.name, 150);
    payload.category = clean(input.category, 80);
    payload.featuredProduct = clean(input.featuredProduct, 150);
    payload.description = clean(input.description, 1500);
    payload.publicContact = clean(input.publicContact, 50);
    payload.generalLocation = clean(input.generalLocation, 250);
    payload.instagram = safePublicUrl(input.instagram);
    payload.marketplace = safePublicUrl(input.marketplace);
    payload.contactApproved = Boolean(input.contactApproved);
    if (String(payload.name).length < 3 || String(payload.description).length < 20) throw new Error("Nama dan deskripsi UMKM belum lengkap.");
  } else if (type === "tourism") {
    payload.title = clean(input.title, 180);
    const requestedCategory = clean(input.category, 80);
    payload.category = STORY_CATEGORIES.includes(requestedCategory as (typeof STORY_CATEGORIES)[number]) ? requestedCategory : "Kegiatan Kelurahan";
    const requestedType = clean(input.articleType, 30);
    payload.articleType = STORY_TYPES.includes(requestedType as (typeof STORY_TYPES)[number]) ? requestedType : "article";
    payload.excerpt = clean(input.excerpt, 350);
    payload.content = clean(input.content, 5000);
    payload.eventDate = clean(input.eventDate, 20);
    payload.generalLocation = clean(input.generalLocation, 250);
    payload.source = clean(input.source, 300);
    if (String(payload.title).length < 3 || String(payload.content).length < 30) throw new Error("Judul dan isi Kabar belum lengkap.");
  } else {
    payload.name = clean(input.name, 150);
    payload.category = clean(input.category, 80);
    payload.description = clean(input.description, 1200);
    payload.generalLocation = clean(input.generalLocation, 250);
    payload.mapsUrl = safePublicUrl(input.mapsUrl);
    const latitude = Number(input.latitude);
    const longitude = Number(input.longitude);
    payload.latitude = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : null;
    payload.longitude = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : null;
    if (String(payload.name).length < 3 || String(payload.description).length < 15) throw new Error("Nama dan deskripsi lokasi belum lengkap.");
  }

  if (type !== "map") {
    if (requestedImage) {
      const upload = await assertPendingUploadOwnership(citizenId, requestedImage);
      if (!upload) throw new Error("Gambar kontribusi harus diunggah melalui formulir yang tersedia.");
      linkedUploadId = upload.id;
      payload.image = requestedImage;
    } else {
      payload.image = type === "umkm" ? "/images/umkm-placeholder.svg" : "/images/story-placeholder.svg";
    }
  }

  const id = randomUUID();
  const number = submissionNumber(type);
  const now = new Date();
  const [citizen] = await db.select({ email: citizenUsers.email, fullName: citizenUsers.fullName }).from(citizenUsers).where(eq(citizenUsers.id, citizenId)).limit(1);
  const audit = auditValues({
    actorIdentity: { id: citizenId, username: citizen?.email || "citizen", name: citizen?.fullName || "Warga", role: "citizen" },
    action: "submission.create",
    entityType: "content_submission",
    entityId: id,
    metadata: { submissionNumber: number, type, linkedUploadId },
    context,
  });
  if (linkedUploadId) {
    await sql.transaction([
      sql`UPDATE pending_uploads SET submission_id=${id}, status='linked', updated_at=${now}
        WHERE id=${linkedUploadId} AND citizen_id=${citizenId} AND status='pending' AND submission_id IS NULL`,
      sql`INSERT INTO content_submissions (id, submission_number, citizen_id, type, status, payload, review_note, published_item_id, created_at, updated_at)
        SELECT ${id}, ${number}, ${citizenId}, ${type}, 'submitted', ${JSON.stringify(payload)}::jsonb, '', '', ${now}, ${now}
        WHERE EXISTS (SELECT 1 FROM pending_uploads WHERE id=${linkedUploadId} AND citizen_id=${citizenId} AND submission_id=${id} AND status='linked')`,
      sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        SELECT ${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt}
        WHERE EXISTS (SELECT 1 FROM content_submissions WHERE id=${id})`,
    ]);
    const [created] = await db.select({ id: contentSubmissions.id }).from(contentSubmissions).where(eq(contentSubmissions.id, id)).limit(1);
    if (!created) throw new Error("Gambar sudah digunakan oleh kontribusi lain. Unggah ulang gambar lalu kirim kembali.");
  } else {
    await sql.transaction([
      sql`INSERT INTO content_submissions (id, submission_number, citizen_id, type, status, payload, review_note, published_item_id, created_at, updated_at)
        VALUES (${id}, ${number}, ${citizenId}, ${type}, 'submitted', ${JSON.stringify(payload)}::jsonb, '', '', ${now}, ${now})`,
      sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
    ]);
  }
  return { id, submissionNumber: number, title: submissionTitle(type, payload) };
}

export async function listCitizenSubmissions(citizenId: string) {
  const rows = await db.select().from(contentSubmissions).where(eq(contentSubmissions.citizenId, citizenId)).orderBy(desc(contentSubmissions.updatedAt));
  return rows.map((row) => ({
    id: row.id,
    submissionNumber: row.submissionNumber,
    type: row.type as ContributionType,
    status: row.status as SubmissionStatus,
    title: submissionTitle(row.type as ContributionType, row.payload),
    reviewNote: row.reviewNote,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

function restrictedRole(role: AdminRole): boolean {
  return role === "reviewer" || role === "auditor";
}

function pseudonym(reference: string): string {
  return `Pemohon ${reference.slice(-4)}`;
}

export async function listStaffRequests(role: AdminRole) {
  const rows = await db
    .select({
      id: serviceRequests.id,
      requestNumber: serviceRequests.requestNumber,
      status: serviceRequests.status,
      applicantName: serviceRequests.applicantName,
      citizenEmail: citizenUsers.email,
      submittedAt: serviceRequests.submittedAt,
      updatedAt: serviceRequests.updatedAt,
    })
    .from(serviceRequests)
    .leftJoin(citizenUsers, eq(serviceRequests.citizenId, citizenUsers.id))
    .orderBy(desc(serviceRequests.updatedAt));

  const restricted = restrictedRole(role);
  return rows.map((row) => ({
    ...row,
    applicantName: restricted ? pseudonym(row.requestNumber) : row.applicantName,
    citizenEmail: restricted ? "" : (row.citizenEmail || ""),
    privacyRestricted: restricted,
    status: row.status as ServiceRequestStatus,
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

function maskIdentity(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(value.length - 8)}${value.slice(-4)}`;
}

export async function getStaffRequest(requestId: string, role: AdminRole, includeSensitive = false) {
  const [row] = await db
    .select({ request: serviceRequests, citizenEmail: citizenUsers.email })
    .from(serviceRequests)
    .leftJoin(citizenUsers, eq(serviceRequests.citizenId, citizenUsers.id))
    .where(eq(serviceRequests.id, requestId))
    .limit(1);
  if (!row) return null;

  const restricted = restrictedRole(role);
  const messages = restricted ? [] : await db.select().from(serviceRequestMessages).where(eq(serviceRequestMessages.requestId, requestId)).orderBy(serviceRequestMessages.createdAt);
  const history = await db.select().from(serviceRequestHistory).where(eq(serviceRequestHistory.requestId, requestId)).orderBy(serviceRequestHistory.createdAt);
  const { identityNumberEncrypted, familyCardNumberEncrypted, ...safeRequest } = row.request;
  const identityNumber = restricted ? "" : decryptSensitive(identityNumberEncrypted);
  const familyCardNumber = restricted ? "" : decryptSensitive(familyCardNumberEncrypted);
  const allowFullSensitive = includeSensitive && !restricted;

  return {
    ...safeRequest,
    applicantName: restricted ? pseudonym(row.request.requestNumber) : row.request.applicantName,
    citizenEmail: restricted ? "" : (row.citizenEmail || ""),
    phone: restricted ? "" : row.request.phone,
    address: restricted ? "" : row.request.address,
    formData: restricted
      ? { ...row.request.formData, businessAddress: "" }
      : row.request.formData,
    citizenNote: restricted ? "" : row.request.citizenNote,
    staffNote: restricted ? "" : row.request.staffNote,
    identityNumber: restricted ? "" : (allowFullSensitive ? identityNumber : maskIdentity(identityNumber)),
    familyCardNumber: restricted ? "" : (allowFullSensitive ? familyCardNumber : maskIdentity(familyCardNumber)),
    sensitiveDataMasked: !allowFullSensitive,
    privacyRestricted: restricted,
    status: row.request.status as ServiceRequestStatus,
    submittedAt: row.request.submittedAt.toISOString(),
    updatedAt: row.request.updatedAt.toISOString(),
    completedAt: row.request.completedAt?.toISOString() || null,
    messages: messages.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    history: history.map((item) => ({
      ...item,
      changedBy: restricted ? "Petugas" : item.changedBy,
      note: restricted ? "" : item.note,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function updateStaffRequest(
  requestId: string,
  input: Record<string, unknown>,
  actor: AdminSession,
  context: AuditContext
) {
  const status = clean(input.status, 40) as ServiceRequestStatus;
  const staffNote = clean(input.staffNote, 1500);
  const assignedTo = clean(input.assignedTo, 120) || actor.fullName;
  if (!REQUEST_STATUSES.includes(status)) throw new Error("Status pengajuan tidak valid.");
  const [current] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!current) throw new Error("Pengajuan tidak ditemukan.");

  const now = new Date();
  const completedAt = status === "completed" ? (current.completedAt || now) : null;
  const audit = auditValues({
    actor,
    context,
    action: "request.update",
    entityType: "service_request",
    entityId: requestId,
    metadata: { previousStatus: current.status, status, assignedTo, noteChanged: staffNote !== current.staffNote },
  });
  await sql.transaction([
    sql`UPDATE service_requests SET status=${status}, staff_note=${staffNote}, assigned_to=${assignedTo}, updated_at=${now}, completed_at=${completedAt} WHERE id=${requestId}`,
    sql`INSERT INTO service_request_history (id, request_id, previous_status, new_status, changed_by, note, created_at)
      SELECT ${randomUUID()}, ${requestId}, ${current.status}, ${status}, ${actor.fullName}, ${staffNote}, ${now}
      WHERE ${current.status} <> ${status}`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
}

export async function addStaffMessage(
  requestId: string,
  input: Record<string, unknown>,
  actor: AdminSession,
  context: AuditContext
) {
  const message = clean(input.message, 1500);
  const isInternal = Boolean(input.isInternal);
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");
  const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!request) throw new Error("Pengajuan tidak ditemukan.");
  const now = new Date();
  const audit = auditValues({
    actor,
    context,
    action: isInternal ? "request.internal_note" : "request.message",
    entityType: "service_request",
    entityId: requestId,
    metadata: { isInternal },
  });
  await sql.transaction([
    sql`INSERT INTO service_request_messages (id, request_id, sender_type, sender_label, message, is_internal, created_at)
      VALUES (${randomUUID()}, ${requestId}, 'staff', ${actor.fullName}, ${message}, ${isInternal}, ${now})`,
    sql`UPDATE service_requests SET updated_at=${now} WHERE id=${requestId}`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
}

export async function listStaffSubmissions(role: AdminRole) {
  const rows = await db
    .select({ submission: contentSubmissions, citizenName: citizenUsers.fullName, citizenEmail: citizenUsers.email })
    .from(contentSubmissions)
    .leftJoin(citizenUsers, eq(contentSubmissions.citizenId, citizenUsers.id))
    .orderBy(desc(contentSubmissions.updatedAt));
  const hideIdentity = role === "reviewer" || role === "auditor";
  const hidePayload = role === "auditor";
  return rows.map(({ submission, citizenName, citizenEmail }) => ({
    ...submission,
    payload: hidePayload ? {} : submission.payload,
    type: submission.type as ContributionType,
    status: submission.status as SubmissionStatus,
    title: submissionTitle(submission.type as ContributionType, submission.payload),
    citizenName: hideIdentity ? "Warga terverifikasi" : (citizenName || ""),
    citizenEmail: hideIdentity ? "" : (citizenEmail || ""),
    privacyRestricted: hideIdentity,
    payloadRestricted: hidePayload,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    publishedAt: submission.publishedAt?.toISOString() || null,
  }));
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8);
}

function applySubmissionPublication(
  data: SiteData,
  row: typeof contentSubmissions.$inferSelect,
  shouldPublish: boolean,
  publishedImageUrl?: string
) {
  const itemId = row.publishedItemId || `warga-${row.id}`;
  const payload = row.payload;
  const next = {
    ...data,
    umkm: [...data.umkm],
    stories: [...data.stories],
    mapLocations: [...data.mapLocations],
    updatedAt: new Date().toISOString(),
  };

  next.umkm = next.umkm.filter((item) => item.id !== itemId);
  next.stories = next.stories.filter((item) => item.id !== itemId);
  next.mapLocations = next.mapLocations.filter((item) => item.id !== itemId);
  if (!shouldPublish) return { data: next, itemId };

  if (row.type === "umkm") {
    const item: UmkmItem = {
      id: itemId,
      slug: `${slugify(String(payload.name || itemId))}-${row.id.slice(0, 8)}`,
      name: String(payload.name || "UMKM Warga"),
      category: String(payload.category || "Lainnya"),
      featuredProduct: String(payload.featuredProduct || ""),
      description: String(payload.description || ""),
      image: publishedImageUrl || String(payload.image || "/images/umkm-placeholder.svg"),
      publicContact: String(payload.publicContact || ""),
      contactApproved: Boolean(payload.contactApproved),
      generalLocation: String(payload.generalLocation || "Benteng Selatan"),
      instagram: String(payload.instagram || ""),
      marketplace: String(payload.marketplace || ""),
      status: "published",
    };
    next.umkm.push(item);
  } else if (row.type === "tourism") {
    const item: StoryItem = {
      id: itemId,
      slug: `${slugify(String(payload.title || itemId))}-${row.id.slice(0, 8)}`,
      title: String(payload.title || "Kabar Warga"),
      category: String(payload.category || "Kegiatan Kelurahan"),
      excerpt: String(payload.excerpt || ""),
      content: String(payload.content || ""),
      image: publishedImageUrl || String(payload.image || "/images/story-placeholder.svg"),
      generalLocation: String(payload.generalLocation || "Benteng Selatan"),
      source: String(payload.source || "Pengajuan warga, diverifikasi kelurahan"),
      articleType: STORY_TYPES.includes(String(payload.articleType) as (typeof STORY_TYPES)[number]) ? String(payload.articleType) as StoryItem["articleType"] : "article",
      publishedAt: new Date().toISOString().slice(0, 10),
      eventDate: String(payload.eventDate || ""),
      featured: false,
      status: "published",
    };
    next.stories.push(item);
  } else {
    const item: MapLocation = {
      id: itemId,
      name: String(payload.name || "Lokasi Warga"),
      category: String(payload.category || "Lokasi Warga"),
      description: String(payload.description || ""),
      latitude: typeof payload.latitude === "number" ? payload.latitude : null,
      longitude: typeof payload.longitude === "number" ? payload.longitude : null,
      generalLocation: String(payload.generalLocation || "Benteng Selatan"),
      mapsUrl: String(payload.mapsUrl || ""),
      status: "published",
    };
    next.mapLocations.push(item);
  }
  return { data: next, itemId };
}

export async function updateStaffSubmission(
  submissionId: string,
  input: Record<string, unknown>,
  actor: AdminSession,
  context: AuditContext
) {
  const status = clean(input.status, 40) as SubmissionStatus;
  const reviewNote = clean(input.reviewNote, 1500);
  if (!SUBMISSION_STATUSES.includes(status)) throw new Error("Status kontribusi tidak valid.");
  const [current] = await db.select().from(contentSubmissions).where(eq(contentSubmissions.id, submissionId)).limit(1);
  if (!current) throw new Error("Kontribusi tidak ditemukan.");

  const now = new Date();
  const changesPublicContent = status === "published" || current.status === "published";

  if (!changesPublicContent) {
    const audit = auditValues({
      actor,
      context,
      action: "submission.review",
      entityType: "content_submission",
      entityId: submissionId,
      metadata: {
        previousStatus: current.status,
        status,
        reviewNoteChanged: reviewNote !== current.reviewNote,
      },
    });
    await sql.transaction([
      sql`UPDATE content_submissions SET status=${status}, review_note=${reviewNote}, updated_at=${now}
        WHERE id=${submissionId}`,
      sql`UPDATE pending_uploads SET status=CASE WHEN ${status}='rejected' THEN 'rejected' ELSE 'linked' END, updated_at=${now}
        WHERE submission_id=${submissionId} AND status IN ('linked','rejected')`,
      sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
    ]);
    return;
  }

  const document = await getSiteDocument();
  const shouldPublish = status === "published";
  const promoted = shouldPublish
    ? await preparePendingUploadPublication(current.payload.image, submissionId)
    : null;
  const publication = applySubmissionPublication(document.data, current, shouldPublish, promoted?.publicUrl);
  const validationErrors = siteDataValidationErrors(publication.data);
  if (validationErrors.length > 0) {
    throw new Error(`Konten hasil moderasi tidak valid: ${validationErrors.slice(0, 3).join("; ")}`);
  }

  const nextVersion = document.version + 1;
  const publishedAt = shouldPublish ? now : null;
  const storedPublishedItemId = (shouldPublish || Boolean(current.publishedItemId)) ? publication.itemId : "";
  const action = shouldPublish ? "submission.publish" : "submission.unpublish";
  const audit = auditValues({
    actor,
    context,
    action,
    entityType: "content_submission",
    entityId: submissionId,
    metadata: {
      previousStatus: current.status,
      status,
      publishedItemId: storedPublishedItemId,
      previousCmsVersion: document.version,
      cmsVersion: nextVersion,
      promotedUploadId: promoted?.uploadId || null,
    },
  });

  const queries = [
    sql`UPDATE cms_documents SET data=${JSON.stringify(publication.data)}::jsonb, version=${nextVersion}, updated_at=${now}
      WHERE id='main' AND version=${document.version} RETURNING version`,
    sql`UPDATE content_submissions SET status=${status}, review_note=${reviewNote}, published_item_id=${storedPublishedItemId}, published_at=${publishedAt}, updated_at=${now}
      WHERE id=${submissionId} AND EXISTS (SELECT 1 FROM cms_documents WHERE id='main' AND version=${nextVersion} AND updated_at=${now})`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
      SELECT ${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt}
      WHERE EXISTS (SELECT 1 FROM cms_documents WHERE id='main' AND version=${nextVersion} AND updated_at=${now})`,
  ];
  if (promoted) {
    queries.push(sql`UPDATE pending_uploads SET status='published', published_url=${promoted.publicUrl}, updated_at=${now}
      WHERE id=${promoted.uploadId} AND submission_id=${submissionId}
        AND EXISTS (SELECT 1 FROM cms_documents WHERE id='main' AND version=${nextVersion} AND updated_at=${now})`);
  } else if (!shouldPublish) {
    queries.push(sql`UPDATE pending_uploads SET status='linked', updated_at=${now}
      WHERE submission_id=${submissionId} AND status IN ('published','promoted')
        AND EXISTS (SELECT 1 FROM cms_documents WHERE id='main' AND version=${nextVersion} AND updated_at=${now})`);
  }
  let results: unknown[];
  try {
    results = await sql.transaction(queries);
  } catch (error) {
    if (promoted?.newlyPromoted) {
      try {
        await rollbackPendingUploadPromotion(promoted.uploadId, promoted.publicUrl);
      } catch (rollbackError) {
        console.error("Gagal membatalkan promosi Blob setelah transaksi publikasi gagal:", rollbackError);
      }
    }
    throw error;
  }
  const updateRows = results[0] as unknown as Array<{ version: number }>;
  if (!Array.isArray(updateRows) || updateRows.length === 0) {
    if (promoted?.newlyPromoted) {
      try {
        await rollbackPendingUploadPromotion(promoted.uploadId, promoted.publicUrl);
      } catch (rollbackError) {
        console.error("Gagal membatalkan promosi Blob setelah konflik CMS:", rollbackError);
      }
    }
    throw new CmsConflictError();
  }
}
