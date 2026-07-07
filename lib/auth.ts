import { currentUser } from "@clerk/nextjs/server";
import type { Role } from "~/utils/constant.schema";

// Authoritative role comes from Clerk publicMetadata.role. currentUser() reads it
// reliably without customizing the session token (can optimize to sessionClaims later).
export async function getRole(): Promise<Role | null> {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  return role === "receptionist" || role === "doctor" ? role : null;
}
