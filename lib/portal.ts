import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";

import { getCitizenSession } from "@/lib/citizen-auth";
import { getSiteData, writeSiteData } from "@/lib/cms";
import { db } from "@/lib/db";
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
import type { MapLocation, StoryItem, UmkmItem } from "@/lib/types";

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
  return Math.random().toString(36).slice(2, 8).toUpperCase();
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
  await db.insert(serviceRequests).values({
    id,
    requestNumber: number,
    citizenId,
    serviceCode: PILOT_SERVICE.code,
    status: "submitted",
    applicantName,
    identityNumberEncrypted: encryptSensitive(identityNumber),
    familyCardNumberEncrypted: encryptSensitive(familyCardNumber),
    phone,
    address,
    formData: { businessName, businessType, businessAddress, purpose },
    citizenNote,
    submittedAt: now,
    updatedAt: now,
  });
  await db.insert(serviceRequestHistory).values({
    id: randomUUID(),
    requestId: id,
    previousStatus: "",
    newStatus: "submitted",
    changedBy: applicantName,
    note: "Pengajuan dikirim oleh warga.",
  });
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

export async function addCitizenMessage(citizenId: string, requestId: string, messageInput: unknown) {
  const message = clean(messageInput, 1500);
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");
  const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.citizenId, citizenId))).limit(1);
  if (!request) throw new Error("Pengajuan tidak ditemukan.");
  const [user] = await db.select({ fullName: citizenUsers.fullName }).from(citizenUsers).where(eq(citizenUsers.id, citizenId)).limit(1);
  await db.insert(serviceRequestMessages).values({
    id: randomUUID(),
    requestId,
    senderType: "citizen",
    senderLabel: user?.fullName || "Warga",
    message,
    isInternal: false,
  });
  await db.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, requestId));
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
    payload.contactApproved = Boolean(input.contactApproved);
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

export async function listStaffRequests() {
  const rows = await db
    .select({ request: serviceRequests, citizenEmail: citizenUsers.email })
    .from(serviceRequests)
    .leftJoin(citizenUsers, eq(serviceRequests.citizenId, citizenUsers.id))
    .orderBy(desc(serviceRequests.updatedAt));
  return rows.map(({ request, citizenEmail }) => ({
    ...request,
    citizenEmail: citizenEmail || "",
    identityNumber: decryptSensitive(request.identityNumberEncrypted),
    familyCardNumber: decryptSensitive(request.familyCardNumberEncrypted),
    status: request.status as ServiceRequestStatus,
    submittedAt: request.submittedAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    completedAt: request.completedAt?.toISOString() || null,
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
  const messages = await db.select().from(serviceRequestMessages).where(eq(serviceRequestMessages.requestId, requestId)).orderBy(serviceRequestMessages.createdAt);
  const history = await db.select().from(serviceRequestHistory).where(eq(serviceRequestHistory.requestId, requestId)).orderBy(serviceRequestHistory.createdAt);
  return {
    ...row.request,
    citizenEmail: row.citizenEmail || "",
    identityNumber: decryptSensitive(row.request.identityNumberEncrypted),
    familyCardNumber: decryptSensitive(row.request.familyCardNumberEncrypted),
    status: row.request.status as ServiceRequestStatus,
    submittedAt: row.request.submittedAt.toISOString(),
    updatedAt: row.request.updatedAt.toISOString(),
    completedAt: row.request.completedAt?.toISOString() || null,
    messages: messages.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    history: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}

export async function updateStaffRequest(requestId: string, input: Record<string, unknown>, staffName: string) {
  const status = clean(input.status, 40) as ServiceRequestStatus;
  const staffNote = clean(input.staffNote, 1500);
  const assignedTo = clean(input.assignedTo, 120) || staffName;
  if (!REQUEST_STATUSES.includes(status)) throw new Error("Status pengajuan tidak valid.");
  const [current] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!current) throw new Error("Pengajuan tidak ditemukan.");

  const now = new Date();
  await db.update(serviceRequests).set({
    status,
    staffNote,
    assignedTo,
    updatedAt: now,
    completedAt: status === "completed" ? (current.completedAt || now) : null,
  }).where(eq(serviceRequests.id, requestId));

  if (current.status !== status) {
    await db.insert(serviceRequestHistory).values({
      id: randomUUID(),
      requestId,
      previousStatus: current.status,
      newStatus: status,
      changedBy: staffName,
      note: staffNote,
    });
  }
}

export async function addStaffMessage(requestId: string, input: Record<string, unknown>, staffName: string) {
  const message = clean(input.message, 1500);
  const isInternal = Boolean(input.isInternal);
  if (message.length < 2) throw new Error("Pesan terlalu pendek.");
  const [request] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.id, requestId)).limit(1);
  if (!request) throw new Error("Pengajuan tidak ditemukan.");
  await db.insert(serviceRequestMessages).values({
    id: randomUUID(),
    requestId,
    senderType: "staff",
    senderLabel: staffName,
    message,
    isInternal,
  });
  await db.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, requestId));
}

export async function listStaffSubmissions() {
  const rows = await db
    .select({ submission: contentSubmissions, citizenName: citizenUsers.fullName, citizenEmail: citizenUsers.email })
    .from(contentSubmissions)
    .leftJoin(citizenUsers, eq(contentSubmissions.citizenId, citizenUsers.id))
    .orderBy(desc(contentSubmissions.updatedAt));
  return rows.map(({ submission, citizenName, citizenEmail }) => ({
    ...submission,
    type: submission.type as ContributionType,
    status: submission.status as SubmissionStatus,
    title: submissionTitle(submission.type as ContributionType, submission.payload),
    citizenName: citizenName || "",
    citizenEmail: citizenEmail || "",
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    publishedAt: submission.publishedAt?.toISOString() || null,
  }));
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || randomUUID().slice(0, 8);
}

async function publishSubmission(row: typeof contentSubmissions.$inferSelect): Promise<string> {
  if (row.publishedItemId) return row.publishedItemId;
  const data = await getSiteData();
  const itemId = `warga-${row.id}`;
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
    if (!data.umkm.some((existing) => existing.id === itemId)) data.umkm.push(item);
  } else if (row.type === "tourism") {
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
    if (!data.stories.some((existing) => existing.id === itemId)) data.stories.push(item);
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
    if (!data.mapLocations.some((existing) => existing.id === itemId)) data.mapLocations.push(item);
  }
  await writeSiteData(data);
  return itemId;
}

export async function updateStaffSubmission(submissionId: string, input: Record<string, unknown>) {
  const status = clean(input.status, 40) as SubmissionStatus;
  const reviewNote = clean(input.reviewNote, 1500);
  if (!SUBMISSION_STATUSES.includes(status)) throw new Error("Status kontribusi tidak valid.");
  const [current] = await db.select().from(contentSubmissions).where(eq(contentSubmissions.id, submissionId)).limit(1);
  if (!current) throw new Error("Kontribusi tidak ditemukan.");

  let publishedItemId = current.publishedItemId;
  let publishedAt = current.publishedAt;
  if (status === "published") {
    publishedItemId = await publishSubmission(current);
    publishedAt = new Date();
  }
  await db.update(contentSubmissions).set({
    status,
    reviewNote,
    publishedItemId,
    publishedAt,
    updatedAt: new Date(),
  }).where(eq(contentSubmissions.id, submissionId));
}
