import { setupServer } from "msw/node";
import { http, HttpResponse, type HttpHandler } from "msw";

/**
 * Shared MSW server for FE tests. Base URL matches apiFetch defaults
 * (http://localhost:3001/api/v1). Tests import `server` to add
 * per-test overrides via `server.use(...)`.
 */
const BASE = "http://localhost:3001/api/v1";

export const defaultHandlers: HttpHandler[] = [
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ error: { code: "UNAUTHENTICATED", message: "" } }, { status: 401 }),
  ),
  // Author filter dropdown (US-005) fetches eagerly on mount; tests that
  // don't override this just want an empty list rather than an MSW miss.
  http.get(`${BASE}/users`, () => HttpResponse.json({ data: [] })),
];

export const server = setupServer(...defaultHandlers);

export { http, HttpResponse, BASE };
