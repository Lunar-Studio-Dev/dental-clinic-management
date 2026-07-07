import { describe, expect, it } from "vitest";
import { staffActionFromEvent } from "~/lib/staff-sync";

const userData = {
  id: "user_1",
  first_name: "Riya",
  last_name: "Reception",
  primary_email_address_id: "e1",
  email_addresses: [{ id: "e1", email_address: "riya@x.com" }],
  public_metadata: { role: "receptionist" },
};

describe("staffActionFromEvent", () => {
  it("upserts a staff user on user.created", () => {
    expect(staffActionFromEvent("user.created", userData)).toEqual({
      kind: "upsert",
      id: "user_1",
      email: "riya@x.com",
      name: "Riya Reception",
      role: "receptionist",
    });
  });

  it("upserts on user.updated", () => {
    expect(staffActionFromEvent("user.updated", userData).kind).toBe("upsert");
  });

  it("deletes on user.deleted", () => {
    expect(staffActionFromEvent("user.deleted", { id: "user_1" })).toEqual({
      kind: "delete",
      id: "user_1",
    });
  });

  it("ignores users without a staff role", () => {
    expect(
      staffActionFromEvent("user.created", {
        ...userData,
        public_metadata: { role: undefined },
      }).kind,
    ).toBe("ignore");
  });

  it("ignores unrelated event types", () => {
    expect(staffActionFromEvent("session.created", userData).kind).toBe(
      "ignore",
    );
  });

  it("picks the primary email when multiple exist", () => {
    const r = staffActionFromEvent("user.created", {
      ...userData,
      primary_email_address_id: "e2",
      email_addresses: [
        { id: "e1", email_address: "old@x.com" },
        { id: "e2", email_address: "primary@x.com" },
      ],
    });
    expect(r).toMatchObject({ email: "primary@x.com" });
  });
});
