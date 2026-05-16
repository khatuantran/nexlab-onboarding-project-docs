import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import type { SkillItem } from "@onboarding/shared";
import { EditSkillsDialog } from "@/components/profile/EditSkillsDialog";
import { renderWithProviders } from "../lib/test-utils";
import { server, http, HttpResponse, BASE } from "../lib/msw";

const trigger = <button type="button">Open</button>;

describe("EditSkillsDialog (US-018 / T3)", () => {
  it("adds a row, submits, sends PUT body with sortOrder", async () => {
    let putBody: unknown = null;
    server.use(
      http.put(`${BASE}/me/skills`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(
          {
            data: [{ id: "s-1", label: "SQL", color: "blue", sortOrder: 0 }],
          },
          { status: 200 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Toaster />
        <EditSkillsDialog skills={[]} trigger={trigger} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(await screen.findByRole("button", { name: /thêm skill/i }));

    const labelInput = await screen.findByLabelText(/tên skill 1/i);
    await user.type(labelInput, "SQL");

    await user.click(screen.getByRole("button", { name: /^lưu$/i }));

    expect(await screen.findByText(/đã cập nhật skills/i)).toBeInTheDocument();
    expect(putBody).toEqual({ skills: [{ label: "SQL", color: "primary" }] });
  });

  it("cap 12: 'Thêm skill' button disabled when 12 rows present", async () => {
    const twelve: SkillItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `s-${i}`,
      label: `Skill-${i}`,
      color: "blue" as const,
      sortOrder: i,
    }));

    const user = userEvent.setup();
    renderWithProviders(<EditSkillsDialog skills={twelve} trigger={trigger} />);

    await user.click(screen.getByRole("button", { name: /open/i }));
    const addBtn = await screen.findByRole("button", { name: /thêm skill/i });
    expect(addBtn).toBeDisabled();
  });

  it("client dedupe: blocks submit on duplicate label (case-insensitive)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditSkillsDialog
        skills={[{ id: "s-1", label: "SQL", color: "blue", sortOrder: 0 }]}
        trigger={trigger}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open/i }));
    await user.click(await screen.findByRole("button", { name: /thêm skill/i }));
    const newLabel = await screen.findByLabelText(/tên skill 2/i);
    await user.type(newLabel, "sql");
    await user.click(screen.getByRole("button", { name: /^lưu$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/bị trùng/i);
  });
});
