import "./env.js";

import { createApp } from "./app.js";
import { config } from "./config.js";
import { dbCheck, pool } from "./db.js";
import { redis, redisCheck } from "./redis.js";
import { logger } from "./logger.js";
import { createSessionMiddleware } from "./middleware/session.js";
import { createAuthRouter } from "./routes/auth.js";
import { createProjectsRouter } from "./routes/projects.js";
import { createFeaturesRouter } from "./routes/features.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { createSectionsRouter } from "./routes/sections.js";
import { createSearchRouter } from "./routes/search.js";
import { createUsersRouter } from "./routes/users.js";
import { createUploadsRouter } from "./routes/uploads.js";
import { createMeRouter } from "./routes/me.js";
import { createWorkspaceRouter } from "./routes/workspace.js";
import { createUserRepo } from "./repos/userRepo.js";
import { createProjectRepo } from "./repos/projectRepo.js";
import { createFeatureRepo } from "./repos/featureRepo.js";
import { createSectionRepo } from "./repos/sectionRepo.js";
import { createSearchRepo } from "./repos/searchRepo.js";
import { createUploadRepo } from "./repos/uploadRepo.js";
import { createUserStatsRepo } from "./repos/userStatsRepo.js";
import { createCloudinaryClient } from "./lib/cloudinary.js";
import { purgeSessionsForUser } from "./lib/sessionPurge.js";
import { createRateLimit } from "./middleware/rateLimit.js";
import { createRequireAuth } from "./middleware/requireAuth.js";
import { db } from "./db/client.js";

const VERSION = "0.1.0";

const userRepo = createUserRepo(db);
const projectRepo = createProjectRepo(db);
const featureRepo = createFeatureRepo(db);
const sectionRepo = createSectionRepo(db);
const searchRepo = createSearchRepo(db);
const uploadRepo = createUploadRepo(db);
const userStatsRepo = createUserStatsRepo(db);
const cloudinary = createCloudinaryClient(config.CLOUDINARY_URL);
const cloudinaryFolder = `onboarding-portal/${config.NODE_ENV}`;
const cloudinaryAvatarsFolder = `${cloudinaryFolder}/avatars`;
const loginRateLimit = createRateLimit({
  redis,
  keyFn: (req) => `login:${req.ip}`,
  max: 10,
  windowSec: 60,
});
const requireAuth = createRequireAuth(userRepo);

const app = createApp({
  dbCheck,
  redisCheck,
  version: VERSION,
  sessionMiddleware: createSessionMiddleware(),
  authRouter: createAuthRouter({ userRepo, loginRateLimit }),
  projectsRouter: createProjectsRouter({ projectRepo, requireAuth }),
  featuresRouter: createFeaturesRouter({ featureRepo, projectRepo, requireAuth, requireAdmin }),
  sectionsRouter: createSectionsRouter({ sectionRepo, requireAuth }),
  searchRouter: createSearchRouter({ searchRepo, requireAuth }),
  usersRouter: createUsersRouter({
    userRepo,
    requireAuth,
    purgeUserSessions: (userId) => purgeSessionsForUser(redis, userId),
  }),
  uploadsRouter: createUploadsRouter({
    uploadRepo,
    featureRepo,
    requireAuth,
    cloudinary,
    cloudinaryFolder,
  }),
  meRouter: createMeRouter({
    userRepo,
    userStatsRepo,
    requireAuth,
    redis,
    cloudinary,
    cloudinaryAvatarsFolder,
  }),
  workspaceRouter: createWorkspaceRouter({ projectRepo, requireAuth }),
});

const server = app.listen(config.API_PORT, () => {
  logger.info({ port: config.API_PORT, env: config.NODE_ENV }, "API listening");
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutting down");
  server.close();
  await Promise.allSettled([pool.end(), redis.quit()]);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
