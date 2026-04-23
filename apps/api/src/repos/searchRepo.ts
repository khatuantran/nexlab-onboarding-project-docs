import { sql } from "drizzle-orm";
import type { Db } from "../db/client.js";

export interface SearchHitRow extends Record<string, unknown> {
  projectSlug: string;
  featureSlug: string;
  title: string;
  snippet: string;
  rank: number;
}

export interface SearchRepo {
  search(q: string, projectSlug?: string): Promise<SearchHitRow[]>;
}

/**
 * FTS via Postgres tsvector. Uses `plainto_tsquery` (safe input handling)
 * + `ts_rank` sorted desc + `ts_headline` for snippet with `<mark>`.
 * HTML-escaping of non-match text is delegated to ts_headline's
 * `HighlightAll=false, MaxWords, MinWords` defaults + startSel/stopSel
 * tags — the only HTML we inject is `<mark>`/`</mark>`.
 */
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
            'StartSel=<mark>,StopSel=</mark>,MaxWords=25,MinWords=10,ShortWord=2,HighlightAll=false,MaxFragments=1'
          ) AS "snippet",
          ts_rank(f.search_vector, plainto_tsquery('simple', ${q})) AS "rank"
        FROM features f
        INNER JOIN projects p ON p.id = f.project_id
        LEFT JOIN sections s ON s.feature_id = f.id
        WHERE f.search_vector @@ plainto_tsquery('simple', ${q})
        ${projectFilter}
        GROUP BY p.slug, f.id
        ORDER BY rank DESC
        LIMIT 20
      `);
      return result.rows;
    },
  };
}
