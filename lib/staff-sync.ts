// Maps a Clerk webhook user event → a Staff upsert/delete. Pure mapping (no I/O),
// so it's unit-testable; the route calls prisma with the result.
import type { StaffRole } from "~/lib/generated/prisma/client";

type ClerkUserData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: { id: string; email_address: string }[];
  public_metadata?: { role?: unknown };
};

export type StaffSyncAction =
  | { kind: "upsert"; id: string; email: string; name: string; role: StaffRole }
  | { kind: "delete"; id: string }
  | { kind: "ignore" };

export function staffActionFromEvent(
  type: string,
  data: { id?: string } & Partial<ClerkUserData>,
): StaffSyncAction {
  if (type === "user.deleted") {
    return data.id ? { kind: "delete", id: data.id } : { kind: "ignore" };
  }

  if (type === "user.created" || type === "user.updated") {
    const role = data.public_metadata?.role;
    if ((role !== "receptionist" && role !== "doctor") || !data.id) {
      return { kind: "ignore" }; // not a staff user (or unknown role)
    }
    const emails = data.email_addresses ?? [];
    const email =
      emails.find((e) => e.id === data.primary_email_address_id)
        ?.email_address ?? emails[0]?.email_address;
    if (!email) return { kind: "ignore" };
    const name =
      [data.first_name, data.last_name].filter(Boolean).join(" ") || email;
    return { kind: "upsert", id: data.id, email, name, role };
  }

  return { kind: "ignore" };
}
