import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { AdminRole } from "@/lib/admin-permissions";
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

export const loginRateLimits = pgTable(
  "login_rate_limits",
  {
    key: text("key").primaryKey(),
    attempts: integer("attempts").default(0).notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    blockedUntil: timestamp("blocked_until", {
      withTimezone: true,
      mode: "date",
    }),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    blockedUntilIdx: index("login_rate_limits_blocked_until_idx").on(
      table.blockedUntil
    ),
  })
);

export const staffUsers = pgTable(
  "staff_users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    role: text("role").$type<AdminRole>().notNull().default("operator"),
    isActive: boolean("is_active").notNull().default(true),
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("staff_users_username_uidx").on(table.username),
    index("staff_users_role_idx").on(table.role),
    index("staff_users_active_idx").on(table.isActive),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    actorUsername: text("actor_username").notNull().default("system"),
    actorName: text("actor_name").notNull().default("System"),
    actorRole: text("actor_role").notNull().default("system"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: text("ip_address").notNull().default("unknown"),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

