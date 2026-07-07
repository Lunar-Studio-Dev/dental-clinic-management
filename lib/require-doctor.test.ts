import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getRoleMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }));
vi.mock("~/lib/auth", () => ({ getRole: () => getRoleMock() }));

import { requireDoctor } from "~/lib/require-doctor";

beforeEach(() => {
  authMock.mockReset();
  getRoleMock.mockReset();
  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("requireDoctor", () => {
  it("401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    expect(await requireDoctor()).toMatchObject({ ok: false, status: 401 });
  });

  it("403 for a receptionist", async () => {
    getRoleMock.mockResolvedValue("receptionist");
    expect(await requireDoctor()).toMatchObject({ ok: false, status: 403 });
  });

  it("ok for a doctor", async () => {
    getRoleMock.mockResolvedValue("doctor");
    expect(await requireDoctor()).toEqual({ ok: true, userId: "user_1" });
  });
});
