import { Badge } from "~/components/ui/badge";
import { isReturning } from "~/lib/patient-utils";

export function PatientStatusBadge({ visitCount }: { visitCount: number }) {
  return isReturning(visitCount) ? (
    <Badge variant="secondary">Returning</Badge>
  ) : (
    <Badge variant="outline">New</Badge>
  );
}
