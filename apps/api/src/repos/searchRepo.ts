import { sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import type {
  AuthorHit,
  FeatureHit,
  FeatureStatus,
  ProjectHit,
  SearchOpts,
  SearchResultsV2,
  SectionHit,
  SectionType,
  UploadHit,
} from "@onboarding/shared";
import { HITS_PER_GROUP } from "@onboarding/shared";

/**
 * SearchRepo (US-005 / FR-SEARCH-002 + FR-SEARCH-003).
 *
 * Multi-entity grouped search backed by Postgres FTS:
 * - projects.search_vector (T1) — name + description.
 * - features.search_vector (US-001 0001 trigger) — title + section bodies.
 * - sections — to_tsvector(body) inline (no own column; corpus small enough).
 * - uploads.search_vector (T1) — filename + caption.
 * - authors — ILIKE display_name + count distinct features touched.
 *
 * Filters apply per-entity:
 * - sectionTypes → sections + features (via join).
 * - authorId → sections + features + uploads (via FK).
 * - updatedSince → all entities (project/feature/section.updated_at, upload.created_at).
 * - status (filled/partial/empty) → features + sections (via filledSectionCount join).
 * - projectSlug → all entities scoped to that project's rows.
 *
 * Archived projects are excluded from every group.
 */

export interface SearchRepo {
  /** Legacy v1 method — kept until US-005 T4 ships the v2 route. */
  search(q: string, projectSlug?: string): Promise<SearchHitRow[]>;
  searchAll(q: string, opts?: SearchOpts): Promise<SearchResultsV2>;
}

export interface SearchHitRow extends Record<string, unknown> {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number;
}

const HEADLINE_OPTS =
  "StartSel=<mark>,StopSel=</mark>,MaxWords=25,MinWords=10,ShortWord=2,HighlightAll=false,MaxFragments=1";

function statusClauseForFeature(filledColumn: SQL, status: FeatureStatus): SQL {
  if (status === "filled") return sql`${filledColumn} = 5`;
  if (status === "empty") return sql`${filledColumn} = 0`;
  return sql`${filledColumn} BETWEEN 1 AND 4`;
}

export function createSearchRepo(db: Db): SearchRepo {
  return {
    async search(q, projectSlug) {
      const projectFilter = projectSlug ? sql`AND p.slug = ${projectSlug}` : sql``;
      const result = await db.execute<SearchHitRow>(sql`
        SELECT
          p.slug AS "projectSlug",
          f.slug AS "featureSlug",
          f.title AS "title",
          ts_headline(
            'simple',
            coalesce(f.title, '') || ' ' || coalesce(string_agg(s.body, ' '), ''),
            plainto_tsquery('simple', ${q}),
            ${HEADLINE_OPTS}
          ) AS "snippet",
          ts_rank(f.search_vector, plainto_tsquery('simple', ${q})) AS "rank"
        FROM features f
        INNER JOIN projects p ON p.id = f.project_id
        LEFT JOIN sections s ON s.feature_id = f.id
        WHERE f.search_vector @@ plainto_tsquery('simple', ${q})
          AND p.archived_at IS NULL
        ${projectFilter}
        GROUP BY p.slug, f.id
        ORDER BY rank DESC
        LIMIT 20
      `);
      return result.rows;
    },

    async searchAll(q, opts = {}) {
      const tsQuery = sql`plainto_tsquery('simple', ${q})`;
      const projectScope = opts.projectSlug ? sql`AND p.slug = ${opts.projectSlug}` : sql``;
      const updatedSince = opts.updatedSince
        ? sql`${new Date(opts.updatedSince).toISOString()}::timestamptz`
        : null;
      const sectionTypeArr =
        opts.sectionTypes && opts.sectionTypes.length > 0 ? opts.sectionTypes : null;
      const sectionTypeInList = sectionTypeArr
        ? sql.join(
            sectionTypeArr.map((t) => sql`${t}`),
            sql`, `,
          )
        : null;

      const [projectsRows, featuresRows, sectionsRows, authorsRows, uploadsRows] =
        await Promise.all([
          db.execute<ProjectHitRow>(sql`
            SELECT
              p.slug AS "slug",
              p.name AS "name",
              ts_headline(
                'simple',
                coalesce(p.name, '') || ' ' || coalesce(p.description, ''),
                ${tsQuery},
                ${HEADLINE_OPTS}
              ) AS "snippet",
              p.updated_at AS "updatedAt",
              ts_rank(p.search_vector, ${tsQuery}) AS "rank",
              (SELECT count(*)::int FROM features WHERE project_id = p.id) AS "featureCount"
            FROM projects p
            WHERE p.search_vector @@ ${tsQuery}
              AND p.archived_at IS NULL
              ${projectScope}
              ${updatedSince ? sql`AND p.updated_at >= ${updatedSince}` : sql``}
            ORDER BY rank DESC
            LIMIT ${HITS_PER_GROUP}
          `),

          db.execute<FeatureHitRow>(sql`
            WITH filled AS (
              SELECT feature_id, count(*) FILTER (WHERE length(trim(body)) > 0)::int AS filled_count
              FROM sections
              GROUP BY feature_id
            )
            SELECT
              p.slug AS "projectSlug",
              f.slug AS "featureSlug",
              f.title AS "title",
              ts_headline(
                'simple',
                coalesce(f.title, '') || ' ' || coalesce(string_agg(s.body, ' '), ''),
                ${tsQuery},
                ${HEADLINE_OPTS}
              ) AS "snippet",
              ts_rank(f.search_vector, ${tsQuery}) AS "rank",
              f.updated_at AS "updatedAt",
              coalesce(max(filled.filled_count), 0) AS "filledSectionCount"
            FROM features f
            INNER JOIN projects p ON p.id = f.project_id AND p.archived_at IS NULL
            LEFT JOIN sections s ON s.feature_id = f.id
            LEFT JOIN filled ON filled.feature_id = f.id
            WHERE f.search_vector @@ ${tsQuery}
              ${projectScope}
              ${
                sectionTypeInList
                  ? sql`AND EXISTS (
                      SELECT 1 FROM sections s2
                      WHERE s2.feature_id = f.id AND s2.type::text IN (${sectionTypeInList})
                    )`
                  : sql``
              }
              ${
                opts.authorId
                  ? sql`AND EXISTS (
                      SELECT 1 FROM sections s3
                      WHERE s3.feature_id = f.id AND s3.updated_by = ${opts.authorId}::uuid
                    )`
                  : sql``
              }
              ${updatedSince ? sql`AND f.updated_at >= ${updatedSince}` : sql``}
            GROUP BY p.slug, f.id
            ${
              opts.status
                ? sql`HAVING ${statusClauseForFeature(sql`coalesce(max(filled.filled_count), 0)`, opts.status)}`
                : sql``
            }
            ORDER BY rank DESC
            LIMIT ${HITS_PER_GROUP}
          `),

          db.execute<SectionHitRow>(sql`
            WITH filled AS (
              SELECT feature_id, count(*) FILTER (WHERE length(trim(body)) > 0)::int AS filled_count
              FROM sections
              GROUP BY feature_id
            )
            SELECT
              p.slug AS "projectSlug",
              f.slug AS "featureSlug",
              f.title AS "featureTitle",
              s.type::text AS "sectionType",
              ts_headline('simple', s.body, ${tsQuery}, ${HEADLINE_OPTS}) AS "snippet",
              s.updated_at AS "updatedAt",
              u.display_name AS "updatedByName",
              ts_rank(to_tsvector('simple', s.body), ${tsQuery}) AS "rank"
            FROM sections s
            INNER JOIN features f ON f.id = s.feature_id
            INNER JOIN projects p ON p.id = f.project_id AND p.archived_at IS NULL
            LEFT JOIN users u ON u.id = s.updated_by
            LEFT JOIN filled ON filled.feature_id = f.id
            WHERE to_tsvector('simple', s.body) @@ ${tsQuery}
              ${projectScope}
              ${sectionTypeInList ? sql`AND s.type::text IN (${sectionTypeInList})` : sql``}
              ${opts.authorId ? sql`AND s.updated_by = ${opts.authorId}::uuid` : sql``}
              ${updatedSince ? sql`AND s.updated_at >= ${updatedSince}` : sql``}
              ${
                opts.status
                  ? sql`AND ${statusClauseForFeature(sql`coalesce(filled.filled_count, 0)`, opts.status)}`
                  : sql``
              }
            ORDER BY rank DESC
            LIMIT ${HITS_PER_GROUP}
          `),

          db.execute<AuthorHitRow>(sql`
            SELECT
              u.id::text AS "id",
              u.display_name AS "displayName",
              u.role::text AS "role",
              count(DISTINCT f.id)::int AS "touchedFeatureCount",
              CASE
                WHEN lower(u.display_name) = lower(${q}) THEN 1.0
                WHEN lower(u.display_name) LIKE lower(${q}) || '%' THEN 0.8
                ELSE 0.5
              END AS "rank"
            FROM users u
            LEFT JOIN sections s ON s.updated_by = u.id
            LEFT JOIN features f ON f.id = s.feature_id
            LEFT JOIN projects p ON p.id = f.project_id AND p.archived_at IS NULL
            WHERE u.display_name ILIKE ${"%" + q + "%"}
            GROUP BY u.id
            ORDER BY "touchedFeatureCount" DESC, "rank" DESC, u.display_name ASC
            LIMIT ${HITS_PER_GROUP}
          `),

          db.execute<UploadHitRow>(sql`
            SELECT
              up.id::text AS "id",
              up.filename AS "filename",
              up.caption AS "caption",
              p.slug AS "projectSlug",
              f.slug AS "featureSlug",
              f.title AS "featureTitle",
              uploader.display_name AS "uploadedByName",
              up.created_at AS "createdAt",
              ts_rank(up.search_vector, ${tsQuery}) AS "rank"
            FROM uploads up
            INNER JOIN features f ON f.id = up.feature_id
            INNER JOIN projects p ON p.id = f.project_id AND p.archived_at IS NULL
            LEFT JOIN users uploader ON uploader.id = up.uploaded_by
            WHERE up.search_vector @@ ${tsQuery}
              ${projectScope}
              ${opts.authorId ? sql`AND up.uploaded_by = ${opts.authorId}::uuid` : sql``}
              ${updatedSince ? sql`AND up.created_at >= ${updatedSince}` : sql``}
            ORDER BY rank DESC
            LIMIT ${HITS_PER_GROUP}
          `),
        ]);

      return {
        projects: projectsRows.rows.map(toProjectHit),
        features: featuresRows.rows.map(toFeatureHit),
        sections: sectionsRows.rows.map(toSectionHit),
        authors: authorsRows.rows.map(toAuthorHit),
        uploads: uploadsRows.rows.map(toUploadHit),
      };
    },
  };
}

interface ProjectHitRow extends Record<string, unknown> {
  slug: string;
  name: string;
  snippet: string;
  updatedAt: Date;
  rank: number | string;
  featureCount: number | string;
}

interface FeatureHitRow extends Record<string, unknown> {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number | string;
  updatedAt: Date;
  filledSectionCount: number | string;
}

interface SectionHitRow extends Record<string, unknown> {
  projectSlug: string;
  featureSlug: string;
  featureTitle: string;
  sectionType: string;
  snippet: string;
  updatedAt: Date;
  updatedByName: string | null;
  rank: number | string;
}

interface AuthorHitRow extends Record<string, unknown> {
  id: string;
  displayName: string;
  role: string;
  touchedFeatureCount: number | string;
  rank: number | string | null;
}

interface UploadHitRow extends Record<string, unknown> {
  id: string;
  filename: string;
  caption: string | null;
  projectSlug: string;
  featureSlug: string;
  featureTitle: string;
  uploadedByName: string | null;
  createdAt: Date;
  rank: number | string;
}

function toProjectHit(row: ProjectHitRow): ProjectHit {
  return {
    slug: row.slug,
    name: row.name,
    snippet: row.snippet,
    featureCount: Number(row.featureCount),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    rank: Number(row.rank),
  };
}

function toFeatureHit(row: FeatureHitRow): FeatureHit {
  return {
    projectSlug: row.projectSlug,
    featureSlug: row.featureSlug,
    title: row.title,
    snippet: row.snippet,
    rank: Number(row.rank),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    filledSectionCount: Number(row.filledSectionCount),
  };
}

function toSectionHit(row: SectionHitRow): SectionHit {
  return {
    projectSlug: row.projectSlug,
    featureSlug: row.featureSlug,
    featureTitle: row.featureTitle,
    sectionType: row.sectionType as SectionType,
    snippet: row.snippet,
    updatedByName: row.updatedByName,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    rank: Number(row.rank),
  };
}

function toAuthorHit(row: AuthorHitRow): AuthorHit {
  return {
    id: row.id,
    displayName: row.displayName,
    role: row.role as "admin" | "author",
    touchedFeatureCount: Number(row.touchedFeatureCount),
    rank: row.rank == null ? 0 : Number(row.rank),
  };
}

function toUploadHit(row: UploadHitRow): UploadHit {
  return {
    id: row.id,
    filename: row.filename,
    caption: row.caption,
    projectSlug: row.projectSlug,
    featureSlug: row.featureSlug,
    featureTitle: row.featureTitle,
    uploadedByName: row.uploadedByName,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    rank: Number(row.rank),
  };
}
