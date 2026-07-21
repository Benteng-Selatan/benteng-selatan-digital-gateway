import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { SiteData } from "@/lib/types";

export const cmsDocuments = pgTable("cms_documents", {
  id: text("id").primaryKey(),
  data: jsonb("data").$type<SiteData>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const citizenUsers = pgTable(
  "citizen_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("citizen_users_email_uidx").on(table.email)],
);

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: text("id").primaryKey(),
    requestNumber: text("request_number").notNull(),
    citizenId: text("citizen_id")
      .notNull()
      .references(() => citizenUsers.id, { onDelete: "cascade" }),
    serviceCode: text("service_code").notNull(),
    status: text("status").notNull().default("submitted"),
    applicantName: text("applicant_name").notNull(),
    identityNumberEncrypted: text("identity_number_encrypted").notNull(),
    familyCardNumberEncrypted: text("family_card_number_encrypted").notNull().default(""),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    formData: jsonb("form_data").$type<Record<string, string>>().notNull(),
    citizenNote: text("citizen_note").notNull().default(""),
    assignedTo: text("assigned_to").notNull().default(""),
    staffNote: text("staff_note").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("service_requests_number_uidx").on(table.requestNumber),
    index("service_requests_citizen_idx").on(table.citizenId),
    index("service_requests_status_idx").on(table.status),
  ],
);

export const serviceRequestMessages = pgTable(
  "service_request_messages",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    senderLabel: text("sender_label").notNull(),
    message: text("message").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("service_request_messages_request_idx").on(table.requestId)],
);

export const serviceRequestHistory = pgTable(
  "service_request_history",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    previousStatus: text("previous_status").notNull(),
    newStatus: text("new_status").notNull(),
    changedBy: text("changed_by").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("service_request_history_request_idx").on(table.requestId)],
);

export const contentSubmissions = pgTable(
  "content_submissions",
  {
    id: text("id").primaryKey(),
    submissionNumber: text("submission_number").notNull(),
    citizenId: text("citizen_id")
      .notNull()
      .references(() => citizenUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("submitted"),
    payload: jsonb("payload").$type<Record<string, string | number | boolean | null>>().notNull(),
    reviewNote: text("review_note").notNull().default(""),
    publishedItemId: text("published_item_id").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [
    uniqueIndex("content_submissions_number_uidx").on(table.submissionNumber),
    index("content_submissions_citizen_idx").on(table.citizenId),
    index("content_submissions_status_idx").on(table.status),
  ],
);
