import { Router, type Request, type Response } from "express";

export type HealthStatus = "ok" | "error";

export interface HealthDeps {
  dbCheck: () => Promise<HealthStatus>;
  redisCheck: () => Promise<HealthStatus>;
  version: string;
}

export function createHealthRouter(deps: HealthDeps): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    const [db, redis] = await Promise.all([deps.dbCheck(), deps.redisCheck()]);
    const status = db === "ok" && redis === "ok" ? "ok" : "degraded";
    res.json({ status, db, redis, version: deps.version });
  });

  return router;
}
