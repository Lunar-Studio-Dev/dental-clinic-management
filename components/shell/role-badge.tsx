import { Badge } from "~/components/ui/badge";
import type { Role } from "~/utils/constant.schema";

const LABELS: Record<Role, string> = {
  receptionist: "Reception",
  doctor: "Doctor",
};

// Read-only role indicator. Role is locked to Clerk metadata — there is no switcher.
export function RoleBadge({ role }: { role: Role | null }) {
  if (!role) return null;
  return <Badge variant="secondary">{LABELS[role]}</Badge>;
}
