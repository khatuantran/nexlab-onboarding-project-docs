import type Redis from "ioredis";

const SESSION_PREFIX = "sess:";

/**
 * Purge every active session belonging to `userId`.
 *
 * connect-redis stores sessions as JSON under keys `sess:<sid>`. There
 * is no secondary index on userId, so we SCAN the keyspace and parse
 * each blob. Pilot scale (≤ 100 users × few concurrent sessions) makes
 * this cheap enough; if the pilot grows we'll add a userId→sids set.
 *
 * Used by US-007 / T5 (admin reset password) — after the hash flips, any
 * surviving session for the target user must 401 on the next request.
 * The session middleware destroys them on key delete (next request finds
 * no session).
 */
export async function purgeSessionsForUser(
  redis: Pick<Redis, "scan" | "get" | "del">,
  userId: string,
): Promise<number> {
  let cursor = "0";
  let deleted = 0;
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", `${SESSION_PREFIX}*`, "COUNT", 100);
    cursor = next;
    if (keys.length === 0) continue;
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { userId?: string };
        if (parsed.userId === userId) {
          await redis.del(key);
          deleted += 1;
        }
      } catch {
        // Malformed session blob — skip, never block the purge.
      }
    }
  } while (cursor !== "0");
  return deleted;
}
