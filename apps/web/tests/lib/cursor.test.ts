import { describe, expect, it } from "vitest";
import { insertAtCursor } from "@/lib/cursor";

describe("insertAtCursor", () => {
  it("inserts at mid position and returns new cursor at end of insert", () => {
    const r = insertAtCursor("hello world", "X", 5);
    expect(r.body).toBe("helloX world");
    expect(r.cursor).toBe(6);
  });

  it("inserts at 0 (empty body)", () => {
    const r = insertAtCursor("", "md", 0);
    expect(r.body).toBe("md");
    expect(r.cursor).toBe(2);
  });

  it("clamps cursor past end", () => {
    const r = insertAtCursor("abc", "Z", 99);
    expect(r.body).toBe("abcZ");
    expect(r.cursor).toBe(4);
  });

  it("clamps negative cursor to 0", () => {
    const r = insertAtCursor("abc", "Z", -5);
    expect(r.body).toBe("Zabc");
    expect(r.cursor).toBe(1);
  });
});
