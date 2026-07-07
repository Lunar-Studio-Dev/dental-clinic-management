import { auth } from "@clerk/nextjs/server";
import { getRole } from "~/lib/auth";

export type DoctorGate =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; message: string };

// Gate for doctor-only admin routes (clinic CRUD, staff assignment).
export async function requireDoctor(): Promise<DoctorGate> {
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, message: "Unauthorized" };
  const role = await getRole();
  if (role !== "doctor")
    return { ok: false, status: 403, message: "Forbidden" };
  return { ok: true, userId };
}
