"use client";

import { useUser } from "@clerk/nextjs";
import type { Role } from "~/utils/constant.schema";

// Client-side role from Clerk publicMetadata (authoritative role is still enforced
// server-side; this just gates UI like the doctor-only note action).
export function useRole(): Role | null {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  return role === "receptionist" || role === "doctor" ? role : null;
}
