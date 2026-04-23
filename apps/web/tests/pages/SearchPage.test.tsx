import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";
import { Routes, Route, useLocation } from "react-router-dom";
import type { SearchHit } from "@onboarding/shared";
import { SearchPage } from "@/pages/SearchPage";
import { renderWithRouter } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

function LocationSpy() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

function renderSearch(initialPath: string) {
  return renderWithRouter(
    <>
      <LocationSpy />
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/projects/:slug/features/:featureSlug"
          element={<div data-testid="feature-page">feature</div>}
        />
      </Routes>
    </>,
    [initialPath],
  );
}

const sampleHits: SearchHit[] = [
  {
    projectSlug: "demo",
    featureSlug: "login-with-email",
    title: "Đăng nhập bằng email",
    snippet: "user <mark>login</mark> với email + password",
    rank: 0.9,
  },
  {
    projectSlug: "demo",
    featureSlug: "search-feature",
    title: "Tìm kiếm feature",
    snippet: "tìm <mark>login</mark> kết quả",
    rank: 0.5,
  },
];

describe("SearchPage", () => {
  it("renders empty-placeholder when q is missing, does not call API", async () => {
    const apiSpy = vi.fn();
    server.use(
      http.get(`${BASE}/search`, () => {
        apiSpy();
        return HttpResponse.json({ data: [] });
      }),
    );

    renderSearch("/search");

    expect(await screen.findByText(/nhập từ khoá/i)).toBeInTheDocument();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("renders hits with breadcrumb, title, sanitized <mark> snippet", async () => {
    server.use(http.get(`${BASE}/search`, () => HttpResponse.json({ data: sampleHits })));

    renderSearch("/search?q=login");

    expect(
      await screen.findByRole("heading", { name: /kết quả cho "login"/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 feature")).toBeInTheDocument();

    const firstRow = screen.getByRole("link", { name: /đăng nhập bằng email/i });
    expect(within(firstRow).getByText(/demo/i)).toBeInTheDocument();
    expect(firstRow.innerHTML).toContain("<mark>login</mark>");
  });

  it("sanitizes <script> in snippet (XSS)", async () => {
    server.use(
      http.get(`${BASE}/search`, () =>
        HttpResponse.json({
          data: [
            {
              ...sampleHits[0],
              snippet: "<script>alert(1)</script><mark>login</mark> attempt",
            },
          ],
        }),
      ),
    );

    renderSearch("/search?q=login");

    const row = await screen.findByRole("link", { name: /đăng nhập bằng email/i });
    expect(row.innerHTML).not.toContain("<script");
    expect(row.innerHTML).toContain("<mark>login</mark>");
  });

  it("empty-result copy when hits = []", async () => {
    server.use(http.get(`${BASE}/search`, () => HttpResponse.json({ data: [] })));

    renderSearch("/search?q=nothing");

    expect(
      await screen.findByText(/không tìm thấy feature nào khớp với "nothing"/i),
    ).toBeInTheDocument();
  });

  it("click row navigates to /projects/:slug/features/:featureSlug", async () => {
    server.use(http.get(`${BASE}/search`, () => HttpResponse.json({ data: sampleHits })));

    const user = userEvent.setup();
    renderSearch("/search?q=login");

    const row = await screen.findByRole("link", { name: /đăng nhập bằng email/i });
    await user.click(row);

    expect(await screen.findByTestId("feature-page")).toBeInTheDocument();
  });

  it("shows scope chip when projectSlug is in URL; click X removes it", async () => {
    server.use(
      http.get(`${BASE}/search`, ({ request }) => {
        const url = new URL(request.url);
        const hasScope = url.searchParams.has("projectSlug");
        return HttpResponse.json({
          data: hasScope ? [sampleHits[0]!] : sampleHits,
        });
      }),
    );

    const user = userEvent.setup();
    renderSearch("/search?q=login&projectSlug=demo");

    // Chip present
    const chip = await screen.findByRole("button", { name: /bỏ lọc/i });
    expect(chip).toBeInTheDocument();
    expect(screen.getByText("1 feature")).toBeInTheDocument();

    // Click X → projectSlug gone, count updates to 2
    await user.click(chip);
    expect(await screen.findByText("2 feature")).toBeInTheDocument();

    const loc = screen.getByTestId("loc");
    expect(loc.textContent).toContain("q=login");
    expect(loc.textContent).not.toContain("projectSlug=");
  });
});
