-- Postgres entrypoint init script (runs only on first volume creation).
-- Creates the dedicated test database so vitest + Playwright can run
-- against isolated data. Existing volumes need a one-time
-- `pnpm db:create:test` call instead.
SELECT 'CREATE DATABASE onboardingdb_test OWNER dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'onboardingdb_test')\gexec
