import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Drizzle schema — source of truth for DB structure.
 * tsvector column + FTS triggers live in hand-written migration
 * 0001_fts_triggers.sql (drizzle does not cover those yet).
 *
 * Cascade policy (see .specs/03-architecture.md §4.1):
 * - features.project_id → projects: CASCADE
 * - sections.feature_id → features: CASCADE
 * - sections.updated_by → users: SET NULL
 * - projects.created_by → users: RESTRICT (via app layer / no explicit onDelete = NO ACTION)
 */

export const userRoleEnum = pgEnum("user_role", ["admin", "author"]);
export const sectionTypeEnum = pgEnum("section_type", [
  "business",
  "user-flow",
  "business-rules",
  "tech-notes",
  "screenshots",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("author"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // US-007 / T1 — soft-delete timestamp matches projects.archived_at pattern.
  // NULL = active; set → archived (login blocked + sessions purged).
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  // US-007 / T1 — informational, updated on successful login. NULL = never logged in.
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  // US-009 / T1 — Cloudinary secure_url của ảnh đại diện. NULL = fallback initials.
  avatarUrl: text("avatar_url"),
  // US-010 / T1 — profile enrichment fields. All nullable; NULL = "Chưa cập nhật".
  phone: text("phone"),
  department: text("department"),
  location: text("location"),
  bio: text("bio"),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Soft-delete timestamp (FR-PROJ-002). NULL = active; set → archived.
  // Catalog list + direct detail lookup phải filter WHERE archived_at IS NULL.
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const features = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    // Soft-delete timestamp (US-008, FR-FEAT-001 amend). NULL = active.
    // listFeatures + findByProjectAndSlug filter WHERE archived_at IS NULL.
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("features_project_slug_uidx").on(table.projectId, table.slug)],
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    type: sectionTypeEnum("type").notNull(),
    body: text("body").notNull().default(""),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sections_feature_type_uidx").on(table.featureId, table.type)],
);

export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  featureId: uuid("feature_id")
    .notNull()
    .references(() => features.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  filename: text("filename").notNull(),
  // FR-SEARCH-002: optional human-readable caption searched via FTS.
  // UI editor for caption defers to a later milestone.
  caption: text("caption"),
  // CR-004 Phase 2: Cloudinary public_id (folder/uuid). Null for rows
  // created before the Cloudinary migration shipped — those rows point
  // at a destroyed Fly volume and will 404 on read. New uploads MUST
  // populate this column.
  cloudinaryPublicId: text("cloudinary_public_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
