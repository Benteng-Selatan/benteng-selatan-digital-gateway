import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import { getCitizenSession } from "@/lib/citizen-auth";
import { getSiteDocument } from "@/lib/cms";
import { db, sqlClient } from "@/lib/db";
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
  requestStatusTransitionIsAllowed,
  type ServiceRequestStatus,
  SUBMISSION_STATUSES,
  submissionStatusTransitionIsAllowed,
  type SubmissionStatus,
} from "@/lib/portal-types";
import { decryptSensitive, encryptSensitive, hashPassword, verifyPassword } from "@/lib/security";
import type { MapLocation, SiteData, StoryItem, UmkmItem } from "@/lib/types";

export class ConcurrentUpdateError extends Error {
  constructor(message = "Data berubah bersamaan. Muat ulang sebelum mencoba lagi.") {
    super(message);
    this.name = "ConcurrentUpdateError";
  }
}

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
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function numericIdentity(value: string): boolean {
  return /^\d{16}$/.test(value);
}

function shortCode(): string {
  return randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
}

function requestNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BS-SKU-${date}-${shortCode()}`;
}

function submissionNumber(type: ContributionType): string {
  const prefix = type === "umkm" ? "UMKM" : type === "tourism" ? "WIS" : "MAP";
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `BS-${prefix}-${date}-${shortCode()}`;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8);
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
    passwordHash: await hashPassword(password),
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
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) return null;
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

export async function createServiceRequest(citizenId: string, input: Record<string, unknown>) {
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
  const formData = { businessName, businessType, businessAddress, purpose };

  const rows = await sqlClient`
    WITH inserted_request AS (
      INSERT INTO service_requests (
        id, request_number, citizen_id, service_code, status, applicant_name,
        identity_number_encrypted, family_card_number_encrypted, phone, address,
        form_data, citizen_note, submitted_at, updated_at
      ) VALUES (
        ${id}, ${number}, ${citizenId}, ${PILOT_SERVICE.code}, 'submitted', ${applicantName},
        ${encryptSensitive(identityNumber)}, ${encryptSensitive(familyCardNumber)}, ${phone}, ${address},
        ${JSON.stringify(formData)}::jsonb, ${citizenNote},
        ${now.toISOString()}::timestamptz, ${now.toISOString()}::timestamptz
      )
      RETURNING id
    )
    INSERT INTO service_request_history (
      id, request_id, previous_status, new_status, changed_by, public_note, note
    )
    SELECT ${randomUUID()}, id, '', 'submitted', ${applicantName},
           'Pengajuan dikirim oleh warga.', 'Pengajuan dikirim oleh warga.'
    FROM inserted_request
    RETURNING request_id
  `;

  if (rows.length !== 1) throw new Error("Pengajuan gagal disimpan secara lengkap.");
  return { id, requestNumber: number };
}

export async function listCitizenRequests(citizenId: string) {
  const rows = await db
    .select({
      id: serviceRequests.id,
      requestNumber: serviceRequests.requestNumber,
      serviceCode: serviceRequests.serviceCode,
      status: serviceRequests.status,
      applicantName: serviceRequests.applicantName,
      submittedAt: serviceRequests.submittedAt,
      updatedAt: serviceRequests.updatedAt,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.citizenId, citizenId))
    .orderBy(desc(serviceRequests.updatedAt));

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
  const [row] = await db
    .select()
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.citizenId, citizenId)))
    .limit(1);
  if (!row) return null;

  const messages = await db
    .select({
      id: serviceRequestMessages.id,
      senderType: serviceRequestMessages.senderType,
      senderLabel: serviceRequestMessages.senderLabel,
      message: serviceRequestMessages.message,
      createdAt: serviceRequestMessages.createdAt,
    })
    .from(serviceRequestMessages)
    .where(and(eq(serviceRequestMessages.requestId, requestId), eq(serviceRequestMessages.isInternal, false)))
    .orderBy(serviceRequestMessages.createdAt);

  const history = await db
    .select({
      id: serviceRequestHistory.id,
      newStatus: serviceRequestHistory.newStatus,
      publicNote: serviceRequestHistory.publicNote,
      createdAt: serviceRequestHistory.createdAt,
    })
    .from(serviceRequestHistory)
    .where(eq(serviceRequestHistory.requestId, requestId))
    .orderBy(serviceRequestHistory.createdAt);

  return {
    id: row.id,
    requestNumber: row.requestNumber,
    serviceCode: row.serviceCode,
    serviceName: PILOT_SERVICE.name,
    status: row.status as ServiceRequestStatus,
    applicantName: row.applicantName,
    identityNumber: decryptSensitive(row.identityNumberEncrypted),
    familyCardNumber: decryptSensitive(row.familyCardNumberEncrypted),
    phone: row.phone,
    address: row.address,
    formData: row.formData,
    citizenNote: row.citizenNote,
    publicNote: row.publicNote,
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() || null,
    messages: messages.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    history: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function addCitizenMessage(citizenId: string, requestId: string, messageInput: unknown) {
  const message = clean(messageInput, 1500);
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");

  const [user] = await db
    .select({ fullName: citizenUsers.fullName })
    .from(citizenUsers)
    .where(eq(citizenUsers.id, citizenId))
    .limit(1);
  const now = new Date();

  const rows = await sqlClient`
    WITH inserted_message AS (
      INSERT INTO service_request_messages (
        id, request_id, sender_type, sender_label, message, is_internal, created_at
      )
      SELECT ${randomUUID()}, sr.id, 'citizen', ${user?.fullName || "Warga"}, ${message}, false,
             ${now.toISOString()}::timestamptz
      FROM service_requests sr
      WHERE sr.id = ${requestId} AND sr.citizen_id = ${citizenId}
      RETURNING request_id
    )
    UPDATE service_requests
    SET updated_at = ${now.toISOString()}::timestamptz
    WHERE id = ${requestId}
      AND EXISTS (SELECT 1 FROM inserted_message)
    RETURNING id
  `;

  if (rows.length !== 1) throw new Error("Pengajuan tidak ditemukan.");
}

function submissionTitle(type: ContributionType, payload: Record<string, string | number | boolean | null>): string {
  return String(type === "umkm" ? payload.name : type === "tourism" ? payload.title : payload.name || "Pengajuan warga");
}

export async function createContentSubmission(citizenId: string, input: Record<string, unknown>) {
  const type = clean(input.type, 20) as ContributionType;
  if (!CONTRIBUTION_TYPES.includes(type)) throw new Error("Jenis kontribusi tidak valid.");

  const payload: Record<string, string | number | boolean | null> = {};
  if (type === "umkm") {
    payload.name = clean(input.name, 150);
    payload.category = clean(input.category, 80);
    payload.featuredProduct = clean(input.featuredProduct, 150);
    payload.description = clean(input.description, 1500);
    payload.publicContact = clean(input.publicContact, 50);
    payload.generalLocation = clean(input.generalLocation, 250);
    payload.instagram = safePublicUrl(input.instagram);
    payload.marketplace = safePublicUrl(input.marketplace);
    payload.image = safePublicUrl(input.image, true) || "/images/umkm-placeholder.svg";
    payload.contactApproved = input.contactApproved === true;
    if (String(payload.name).length < 3 || String(payload.description).length < 20) throw new Error("Nama dan deskripsi UMKM belum lengkap.");
  } else if (type === "tourism") {
    payload.title = clean(input.title, 180);
    payload.category = clean(input.category, 80);
    payload.excerpt = clean(input.excerpt, 350);
    payload.content = clean(input.content, 3000);
    payload.generalLocation = clean(input.generalLocation, 250);
    payload.source = clean(input.source, 300);
    payload.image = safePublicUrl(input.image, true) || "/images/story-placeholder.svg";
    if (String(payload.title).length < 3 || String(payload.content).length < 30) throw new Error("Judul dan uraian wisata/budaya belum lengkap.");
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

  const id = randomUUID();
  const number = submissionNumber(type);
  await db.insert(contentSubmissions).values({
    id,
    submissionNumber: number,
    citizenId,
    type,
    status: "submitted",
    payload,
    updatedAt: new Date(),
  });
  return { id, submissionNumber: number, title: submissionTitle(type, payload) };
}

export async function listCitizenSubmissions(citizenId: string) {
  const rows = await db
    .select({
      id: contentSubmissions.id,
      submissionNumber: contentSubmissions.submissionNumber,
      type: contentSubmissions.type,
      status: contentSubmissions.status,
      payload: contentSubmissions.payload,
      reviewNote: contentSubmissions.reviewNote,
      updatedAt: contentSubmissions.updatedAt,
    })
    .from(contentSubmissions)
    .where(eq(contentSubmissions.citizenId, citizenId))
    .orderBy(desc(contentSubmissions.updatedAt));

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

export async function listStaffRequests() {
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

  return rows.map((row) => ({
    id: row.id,
    requestNumber: row.requestNumber,
    status: row.status as ServiceRequestStatus,
    applicantName: row.applicantName,
    citizenEmail: row.citizenEmail || "",
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getStaffRequest(requestId: string) {
  const [row] = await db
    .select({ request: serviceRequests, citizenEmail: citizenUsers.email })
    .from(serviceRequests)
    .leftJoin(citizenUsers, eq(serviceRequests.citizenId, citizenUsers.id))
    .where(eq(serviceRequests.id, requestId))
    .limit(1);
  if (!row) return null;

  const messages = await db
    .select({
      id: serviceRequestMessages.id,
      senderType: serviceRequestMessages.senderType,
      senderLabel: serviceRequestMessages.senderLabel,
      message: serviceRequestMessages.message,
      isInternal: serviceRequestMessages.isInternal,
      createdAt: serviceRequestMessages.createdAt,
    })
    .from(serviceRequestMessages)
    .where(eq(serviceRequestMessages.requestId, requestId))
    .orderBy(serviceRequestMessages.createdAt);

  const history = await db
    .select({
      id: serviceRequestHistory.id,
      previousStatus: serviceRequestHistory.previousStatus,
      newStatus: serviceRequestHistory.newStatus,
      changedBy: serviceRequestHistory.changedBy,
      publicNote: serviceRequestHistory.publicNote,
      note: serviceRequestHistory.note,
      createdAt: serviceRequestHistory.createdAt,
    })
    .from(serviceRequestHistory)
    .where(eq(serviceRequestHistory.requestId, requestId))
    .orderBy(serviceRequestHistory.createdAt);

  const request = row.request;
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    serviceCode: request.serviceCode,
    status: request.status as ServiceRequestStatus,
    applicantName: request.applicantName,
    citizenEmail: row.citizenEmail || "",
    identityNumber: decryptSensitive(request.identityNumberEncrypted),
    familyCardNumber: decryptSensitive(request.familyCardNumberEncrypted),
    phone: request.phone,
    address: request.address,
    formData: request.formData,
    citizenNote: request.citizenNote,
    assignedTo: request.assignedTo,
    publicNote: request.publicNote,
    staffNote: request.staffNote,
    submittedAt: request.submittedAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() || null,
    messages: messages.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    history: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function updateStaffRequest(requestId: string, input: Record<string, unknown>, staffName: string) {
  const status = clean(input.status, 40) as ServiceRequestStatus;
  const publicNote = clean(input.publicNote, 1500);
  const staffNote = clean(input.staffNote, 1500);
  const assignedTo = clean(input.assignedTo, 120) || staffName;
  if (!REQUEST_STATUSES.includes(status)) throw new Error("Status pengajuan tidak valid.");

  const [current] = await db
    .select({ status: serviceRequests.status, updatedAt: serviceRequests.updatedAt })
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);
  if (!current) throw new Error("Pengajuan tidak ditemukan.");

  const currentStatus = current.status as ServiceRequestStatus;
  if (!REQUEST_STATUSES.includes(currentStatus)) throw new Error("Status pengajuan saat ini tidak dikenali.");
  if (!requestStatusTransitionIsAllowed(currentStatus, status)) {
    throw new Error(`Perubahan status dari ${currentStatus} ke ${status} tidak diperbolehkan.`);
  }
  if ((status === "revision_required" || status === "rejected") && publicNote.length < 5) {
    throw new Error("Catatan untuk warga wajib diisi saat meminta perbaikan atau menolak pengajuan.");
  }

  const now = new Date();
  if (currentStatus === status) {
    const rows = await sqlClient`
      UPDATE service_requests
      SET public_note = ${publicNote},
          staff_note = ${staffNote},
          assigned_to = ${assignedTo},
          updated_at = ${now.toISOString()}::timestamptz
      WHERE id = ${requestId}
        AND status = ${currentStatus}
        AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
      RETURNING id
    `;
    if (rows.length !== 1) throw new ConcurrentUpdateError("Pengajuan berubah saat sedang diperbarui. Muat ulang detail.");
    return;
  }

  const rows = await sqlClient`
    WITH updated_request AS (
      UPDATE service_requests
      SET status = ${status},
          public_note = ${publicNote},
          staff_note = ${staffNote},
          assigned_to = ${assignedTo},
          updated_at = ${now.toISOString()}::timestamptz,
          completed_at = CASE
            WHEN ${status} = 'completed' THEN COALESCE(completed_at, ${now.toISOString()}::timestamptz)
            ELSE completed_at
          END
      WHERE id = ${requestId}
        AND status = ${currentStatus}
        AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
      RETURNING id
    )
    INSERT INTO service_request_history (
      id, request_id, previous_status, new_status, changed_by, public_note, note, created_at
    )
    SELECT ${randomUUID()}, id, ${currentStatus}, ${status}, ${staffName}, ${publicNote}, ${staffNote},
           ${now.toISOString()}::timestamptz
    FROM updated_request
    RETURNING request_id
  `;

  if (rows.length !== 1) throw new ConcurrentUpdateError("Pengajuan berubah saat sedang diperbarui. Muat ulang detail.");
}

export async function addStaffMessage(requestId: string, input: Record<string, unknown>, staffName: string) {
  const message = clean(input.message, 1500);
  const isInternal = input.isInternal === true;
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");
  const now = new Date();

  const rows = await sqlClient`
    WITH inserted_message AS (
      INSERT INTO service_request_messages (
        id, request_id, sender_type, sender_label, message, is_internal, created_at
      )
      SELECT ${randomUUID()}, sr.id, 'staff', ${staffName}, ${message}, ${isInternal},
             ${now.toISOString()}::timestamptz
      FROM service_requests sr
      WHERE sr.id = ${requestId}
      RETURNING request_id
    )
    UPDATE service_requests
    SET updated_at = ${now.toISOString()}::timestamptz
    WHERE id = ${requestId}
      AND EXISTS (SELECT 1 FROM inserted_message)
    RETURNING id
  `;

  if (rows.length !== 1) throw new Error("Pengajuan tidak ditemukan.");
}

export async function listStaffSubmissions() {
  const rows = await db
    .select({ submission: contentSubmissions, citizenName: citizenUsers.fullName, citizenEmail: citizenUsers.email })
    .from(contentSubmissions)
    .leftJoin(citizenUsers, eq(contentSubmissions.citizenId, citizenUsers.id))
    .orderBy(desc(contentSubmissions.updatedAt));

  return rows.map(({ submission, citizenName, citizenEmail }) => ({
    id: submission.id,
    submissionNumber: submission.submissionNumber,
    type: submission.type as ContributionType,
    status: submission.status as SubmissionStatus,
    title: submissionTitle(submission.type as ContributionType, submission.payload),
    payload: submission.payload,
    reviewNote: submission.reviewNote,
    publishedItemId: submission.publishedItemId,
    citizenName: citizenName || "",
    citizenEmail: citizenEmail || "",
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    publishedAt: submission.publishedAt?.toISOString() || null,
  }));
}

function removePublishedItem(data: SiteData, itemId: string): void {
  data.umkm = data.umkm.filter((item) => item.id !== itemId);
  data.stories = data.stories.filter((item) => item.id !== itemId);
  data.mapLocations = data.mapLocations.filter((item) => item.id !== itemId);
}

function addPublishedItem(
  data: SiteData,
  row: typeof contentSubmissions.$inferSelect,
  itemId: string,
): void {
  const payload = row.payload;
  if (row.type === "umkm") {
    const item: UmkmItem = {
      id: itemId,
      slug: `${slugify(String(payload.name || itemId))}-${row.id.slice(0, 8)}`,
      name: String(payload.name || "UMKM Warga"),
      category: String(payload.category || "Lainnya"),
      featuredProduct: String(payload.featuredProduct || ""),
      description: String(payload.description || ""),
      image: String(payload.image || "/images/umkm-placeholder.svg"),
      publicContact: String(payload.publicContact || ""),
      contactApproved: Boolean(payload.contactApproved),
      generalLocation: String(payload.generalLocation || "Benteng Selatan"),
      instagram: String(payload.instagram || ""),
      marketplace: String(payload.marketplace || ""),
      status: "published",
    };
    data.umkm.push(item);
    return;
  }

  if (row.type === "tourism") {
    const item: StoryItem = {
      id: itemId,
      slug: `${slugify(String(payload.title || itemId))}-${row.id.slice(0, 8)}`,
      title: String(payload.title || "Potensi Lokal"),
      category: String(payload.category || "Wisata & Budaya"),
      excerpt: String(payload.excerpt || ""),
      content: String(payload.content || ""),
      image: String(payload.image || "/images/story-placeholder.svg"),
      generalLocation: String(payload.generalLocation || "Benteng Selatan"),
      source: String(payload.source || "Pengajuan warga, diverifikasi kelurahan"),
      status: "published",
    };
    data.stories.push(item);
    return;
  }

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
  data.mapLocations.push(item);
}

async function syncSubmissionPublication(
  current: typeof contentSubmissions.$inferSelect,
  status: SubmissionStatus,
  reviewNote: string,
): Promise<void> {
  const itemId = current.publishedItemId || `warga-${current.id}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const document = await getSiteDocument();
    const data = structuredClone(document.data);
    removePublishedItem(data, itemId);
    if (status === "published") addPublishedItem(data, current, itemId);

    const now = new Date();
    data.updatedAt = now.toISOString();
    const publishedAt = status === "published"
      ? (current.publishedAt || now).toISOString()
      : null;

    try {
      const [lockedRows, cmsRows, submissionRows] = await sqlClient.transaction(
        [
          sqlClient`
            SELECT id
            FROM content_submissions
            WHERE id = ${current.id}
              AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
            FOR UPDATE
          `,
          sqlClient`
            UPDATE cms_documents
            SET data = ${JSON.stringify(data)}::jsonb,
                updated_at = ${now.toISOString()}::timestamptz
            WHERE id = 'main'
              AND updated_at = ${document.revision}::timestamptz
              AND EXISTS (
                SELECT 1 FROM content_submissions
                WHERE id = ${current.id}
                  AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
              )
            RETURNING id
          `,
          sqlClient`
            UPDATE content_submissions
            SET status = ${status},
                review_note = ${reviewNote},
                published_item_id = ${itemId},
                published_at = ${publishedAt}::timestamptz,
                updated_at = ${now.toISOString()}::timestamptz
            WHERE id = ${current.id}
              AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
              AND EXISTS (
                SELECT 1 FROM cms_documents
                WHERE id = 'main'
                  AND updated_at = ${now.toISOString()}::timestamptz
              )
            RETURNING id
          `,
        ],
        { isolationLevel: "Serializable" },
      );

      if (lockedRows.length === 1 && cmsRows.length === 1 && submissionRows.length === 1) return;
      if (lockedRows.length === 0) {
        throw new ConcurrentUpdateError("Kontribusi berubah saat sedang dimoderasi. Muat ulang daftar.");
      }
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";
      if (code === "40001") {
        if (attempt < 2) continue;
        throw new ConcurrentUpdateError("Transaksi publikasi berkonflik berulang kali. Muat ulang daftar.");
      }
      throw error;
    }
  }

  throw new ConcurrentUpdateError("Konten CMS berubah bersamaan. Muat ulang lalu ulangi moderasi.");
}

export async function updateStaffSubmission(submissionId: string, input: Record<string, unknown>) {
  const status = clean(input.status, 40) as SubmissionStatus;
  const reviewNote = clean(input.reviewNote, 1500);
  if (!SUBMISSION_STATUSES.includes(status)) throw new Error("Status kontribusi tidak valid.");

  const [current] = await db.select().from(contentSubmissions).where(eq(contentSubmissions.id, submissionId)).limit(1);
  if (!current) throw new Error("Kontribusi tidak ditemukan.");

  const currentStatus = current.status as SubmissionStatus;
  if (!SUBMISSION_STATUSES.includes(currentStatus)) throw new Error("Status kontribusi saat ini tidak dikenali.");
  if (!submissionStatusTransitionIsAllowed(currentStatus, status)) {
    throw new Error(`Perubahan status dari ${currentStatus} ke ${status} tidak diperbolehkan.`);
  }
  if ((status === "revision_required" || status === "rejected") && reviewNote.length < 5) {
    throw new Error("Catatan untuk warga wajib diisi saat meminta perbaikan atau menolak kontribusi.");
  }

  if (status === "published" || current.status === "published" || current.publishedItemId) {
    await syncSubmissionPublication(current, status, reviewNote);
    return;
  }

  const now = new Date();
  const rows = await sqlClient`
    UPDATE content_submissions
    SET status = ${status},
        review_note = ${reviewNote},
        updated_at = ${now.toISOString()}::timestamptz
    WHERE id = ${submissionId}
      AND updated_at = ${current.updatedAt.toISOString()}::timestamptz
    RETURNING id
  `;
  if (rows.length !== 1) throw new ConcurrentUpdateError("Kontribusi berubah saat sedang dimoderasi. Muat ulang daftar.");
}
