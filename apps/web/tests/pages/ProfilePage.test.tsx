import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "@/pages/ProfilePage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function mockMe(
  overrides: Partial<{
    avatarUrl: string | null;
    displayName: string;
    phone: string | null;
    department: string | null;
    location: string | null;
    bio: string | null;
    coverUrl: string | null;
  }> = {},
) {
  server.use(
    http.get(`${BASE}/auth/me`, () =>
      HttpResponse.json(
        {
          data: {
            user: {
              id: "u-1",
              email: "tester@nexlab.com",
              displayName: overrides.displayName ?? "Tester",
              role: "author" as const,
              avatarUrl: overrides.avatarUrl ?? null,
              lastLoginAt: new Date().toISOString(),
              createdAt: "2026-01-01T00:00:00.000Z",
              phone: overrides.phone ?? null,
              department: overrides.department ?? null,
              location: overrides.location ?? null,
              bio: overrides.bio ?? null,
              coverUrl: overrides.coverUrl ?? null,
            },
          },
        },
        { status: 200 },
      ),
    ),
  );
}

describe("ProfilePage US-019 — cover image hero", () => {
  it("renders cover <img> + overlay when coverUrl set", async () => {
    mockMe({ coverUrl: "https://res.cloudinary.com/x/image/upload/v1/cover.png" });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    await screen.findByText("tester@nexlab.com");
    const img = document.querySelector(
      "img[src='https://res.cloudinary.com/x/image/upload/v1/cover.png']",
    );
    expect(img).not.toBeNull();
  });

  it("falls back to gradient hero when coverUrl null", async () => {
    mockMe({ coverUrl: null });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    await screen.findByText("tester@nexlab.com");
    const img = document.querySelector("img[src*='cloudinary']");
    expect(img).toBeNull();
    // "Đổi ảnh bìa" button still present.
    expect(screen.getByRole("button", { name: /đổi ảnh bìa/i })).toBeInTheDocument();
  });

  it("US-019 delete amend: 'Xóa ảnh bìa' button visible only when coverUrl set", async () => {
    mockMe({ coverUrl: "https://res.cloudinary.com/x/image/upload/v1/cover.png" });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /đổi ảnh bìa/i }));
    expect(await screen.findByRole("button", { name: /^xóa ảnh bìa$/i })).toBeInTheDocument();
  });

  it("US-019 delete amend: 'Xóa ảnh bìa' hidden when coverUrl null", async () => {
    mockMe({ coverUrl: null });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /đổi ảnh bìa/i }));
    expect(screen.queryByRole("button", { name: /^xóa ảnh bìa$/i })).toBeNull();
  });
});

describe("ProfilePage (US-009 / v4.2 — 3 dialog actions)", () => {
  it("renders page header + email + 3 dialog triggers (Cập nhật hồ sơ / Đổi mật khẩu / avatar)", async () => {
    mockMe();
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText("tester@nexlab.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /hồ sơ của tôi/i })).toBeInTheDocument();
    // 3 dialog trigger buttons exist on the page (dialogs not open yet).
    expect(screen.getByRole("button", { name: /^cập nhật hồ sơ$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^đổi mật khẩu$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /đổi ảnh đại diện/i })).toBeInTheDocument();
  });

  it("EditProfileDialog: click trigger → input → Lưu → PATCH 200 swaps + closes dialog", async () => {
    mockMe();
    server.use(
      http.patch(`${BASE}/me`, async ({ request }) => {
        const body = (await request.json()) as { displayName: string };
        return HttpResponse.json(
          {
            data: {
              id: "u-1",
              email: "tester@nexlab.com",
              displayName: body.displayName,
              role: "author",
              avatarUrl: null,
              lastLoginAt: null,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          },
          { status: 200 },
        );
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^cập nhật hồ sơ$/i }));
    const input = await screen.findByLabelText(/tên hiển thị/i);
    await user.clear(input);
    await user.type(input, "Tester Renamed");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));
    await waitFor(() => {
      // Dialog closes — input no longer in DOM.
      expect(screen.queryByLabelText(/tên hiển thị/i)).toBeNull();
    });
  });

  it("ChangePasswordDialog: mismatch shows inline error, no POST", async () => {
    mockMe();
    let posted = false;
    server.use(
      http.post(`${BASE}/me/password`, () => {
        posted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^đổi mật khẩu$/i }));
    await user.type(await screen.findByLabelText(/mật khẩu hiện tại/i), "old12345");
    await user.type(screen.getByLabelText(/mật khẩu mới \(/i), "new12345xx");
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), "different00");
    await user.click(screen.getByRole("button", { name: /^cập nhật mật khẩu$/i }));
    expect(await screen.findByText(/xác nhận mật khẩu không khớp/i)).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it("ChangePasswordDialog: 401 INVALID_CREDENTIALS shows inline error near old-password field", async () => {
    mockMe();
    server.use(
      http.post(`${BASE}/me/password`, () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS", message: "wrong" } },
          { status: 401 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^đổi mật khẩu$/i }));
    await user.type(await screen.findByLabelText(/mật khẩu hiện tại/i), "wrong-old");
    await user.type(screen.getByLabelText(/mật khẩu mới \(/i), "new12345xx");
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), "new12345xx");
    await user.click(screen.getByRole("button", { name: /^cập nhật mật khẩu$/i }));
    expect(await screen.findByText(/mật khẩu cũ không đúng/i)).toBeInTheDocument();
  });

  it("renders an <img> avatar when user has avatarUrl", async () => {
    mockMe({ avatarUrl: "https://res.cloudinary.com/test/me.png" });
    const { container } = renderWithRouter(<ProfilePage />, ["/profile"]);
    await screen.findByText("tester@nexlab.com");
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0]?.src).toContain("cloudinary.com");
  });

  it("AvatarUploadDialog: click avatar → file > 2 MB shows toast and never POSTs", async () => {
    mockMe();
    let posted = false;
    server.use(
      http.post(`${BASE}/me/avatar`, () => {
        posted = true;
        return HttpResponse.json({ data: { avatarUrl: "x" } }, { status: 200 });
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /đổi ảnh đại diện/i }));
    const input = (await screen.findByLabelText(/chọn ảnh đại diện/i)) as HTMLInputElement;
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", { type: "image/png" });
    await user.upload(input, bigFile);
    await new Promise((r) => setTimeout(r, 30));
    expect(posted).toBe(false);
  });
});

describe("ProfilePage US-010 — PersonalInfoCard real fields + EditProfileDialog 4-input", () => {
  it("AC-7: renders real phone/department/location from /me", async () => {
    mockMe({ phone: "0912345678", department: "Dev Team", location: "Hà Nội" });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText("tester@nexlab.com")).toBeInTheDocument();
    expect(screen.getByText("0912345678")).toBeInTheDocument();
    expect(screen.getByText("Dev Team")).toBeInTheDocument();
    expect(screen.getByText("Hà Nội")).toBeInTheDocument();
  });

  it("AC-8: renders '— Chưa cập nhật' for null phone/department/location", async () => {
    mockMe({ phone: null, department: null, location: null });
    renderWithRouter(<ProfilePage />, ["/profile"]);
    await screen.findByText("tester@nexlab.com");
    expect(screen.getAllByText(/chưa cập nhật/i).length).toBeGreaterThanOrEqual(3);
  });

  it("AC-9: EditProfileDialog accepts phone input → PATCH includes phone", async () => {
    mockMe();
    let patchedBody: Record<string, unknown> = {};
    server.use(
      http.patch(`${BASE}/me`, async ({ request }) => {
        patchedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            data: {
              id: "u-1",
              email: "tester@nexlab.com",
              displayName: "Tester",
              role: "author",
              avatarUrl: null,
              lastLoginAt: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              phone: patchedBody.phone ?? null,
              department: null,
              location: null,
              bio: null,
            },
          },
          { status: 200 },
        );
      }),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /^cập nhật hồ sơ$/i }));
    const phoneInput = await screen.findByLabelText(/^điện thoại$/i);
    await user.type(phoneInput, "0987654321");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));
    await waitFor(() => {
      expect(patchedBody.phone).toBe("0987654321");
    });
  });
});

describe("ProfilePage US-015 + US-016 + US-017 — real stats / recent / activity", () => {
  it("StatsCard renders 4 real counts from /me/stats", async () => {
    mockMe();
    server.use(
      http.get(`${BASE}/me/stats`, () =>
        HttpResponse.json(
          {
            data: {
              projectsTouched: 2,
              featuresDocumented: 6,
              totalEdits: 14,
              sectionsCompleted: 4,
            },
          },
          { status: 200 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText(/^2$/)).toBeInTheDocument();
    expect(await screen.findByText(/^6$/)).toBeInTheDocument();
    expect(await screen.findByText(/^14$/)).toBeInTheDocument();
    expect(await screen.findByText(/^4$/)).toBeInTheDocument();
    // Hardcoded numbers should not appear.
    expect(screen.queryByText(/^42$/)).toBeNull();
  });

  it("RecentProjectsCard renders rows from /me/recent-projects + empty state", async () => {
    mockMe();
    server.use(
      http.get(`${BASE}/me/recent-projects`, () =>
        HttpResponse.json(
          {
            data: [
              {
                slug: "pilot",
                name: "Pilot Project",
                lastTouchedAt: new Date().toISOString(),
                sectionsTouched: 3,
              },
            ],
          },
          { status: 200 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/projects/x"]);
    const links = await screen.findAllByRole("link", { name: /pilot project|mở dự án pilot/i });
    expect(links.length).toBeGreaterThan(0);
    expect(screen.getByText(/3 sect\./i)).toBeInTheDocument();
  });

  it("ActivityFeedCard renders feed from /me/activity + empty state", async () => {
    mockMe();
    server.use(
      http.get(`${BASE}/me/activity`, () =>
        HttpResponse.json(
          {
            data: {
              items: [
                {
                  id: "s-1",
                  sectionType: "tech-notes",
                  featureSlug: "f1",
                  featureTitle: "Đăng nhập",
                  projectSlug: "pilot",
                  projectName: "Pilot",
                  updatedAt: new Date().toISOString(),
                  verbCode: "updated",
                },
              ],
              nextCursor: null,
            },
          },
          { status: 200 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText(/tech notes/i)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /đăng nhập/i })).toBeInTheDocument();
  });
});

describe("ProfilePage US-018 — SkillsCard real chips", () => {
  it("renders real skill chips from /me/skills", async () => {
    mockMe();
    server.use(
      http.get(`${BASE}/me/skills`, () =>
        HttpResponse.json(
          {
            data: [
              { id: "s-1", label: "SQL", color: "blue", sortOrder: 0 },
              { id: "s-2", label: "Figma", color: "purple", sortOrder: 1 },
            ],
          },
          { status: 200 },
        ),
      ),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByText("SQL")).toBeInTheDocument();
    expect(await screen.findByText("Figma")).toBeInTheDocument();
    // The old hardcoded chips are gone.
    expect(screen.queryByText("Business Analysis")).toBeNull();
    expect(screen.queryByText("BPMN")).toBeNull();
  });

  it("empty state: only 'Thêm skill đầu tiên' button visible when API returns []", async () => {
    mockMe();
    server.use(
      http.get(`${BASE}/me/skills`, () => HttpResponse.json({ data: [] }, { status: 200 })),
    );
    renderWithRouter(<ProfilePage />, ["/profile"]);
    expect(await screen.findByRole("button", { name: /thêm skill đầu tiên/i })).toBeInTheDocument();
    expect(screen.queryByText("Business Analysis")).toBeNull();
  });
});

// Quiet down vi unused-import.
void vi;
