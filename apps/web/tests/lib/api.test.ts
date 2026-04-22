import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiFetch, ApiError } from "../../src/lib/api";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("apiFetch", () => {
  it("returns parsed data on 200", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/health", () =>
        HttpResponse.json({ status: "ok", db: "ok", redis: "ok", version: "0.1.0" }),
      ),
    );

    const body = await apiFetch<{ status: string }>("/health");

    expect(body.status).toBe("ok");
  });

  it("throws ApiError preserving code + message on 401", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/whoami", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHENTICATED", message: "Bạn cần đăng nhập" } },
          { status: 401 },
        ),
      ),
    );

    await expect(apiFetch("/whoami")).rejects.toMatchObject({
      name: "ApiError",
      code: "UNAUTHENTICATED",
      status: 401,
    });
  });

  it("ApiError is an instance of Error", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/x", () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "x" } }, { status: 404 }),
      ),
    );

    try {
      await apiFetch("/x");
      throw new Error("should not reach");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});
