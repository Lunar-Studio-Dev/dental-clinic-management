import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import type { VisitListItem as VisitListItemT } from "~/lib/data/types";
import { formatVisitTime, visitTypeLabel } from "~/lib/visit-utils";

export function VisitListItem({ visit }: { visit: VisitListItemT }) {
  return (
    <Link
      href={`/patients/${visit.patientId}`}
      className="hover:bg-muted/60 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
    >
      <span className="text-muted-foreground w-12 shrink-0 text-sm tabular-nums">
        {formatVisitTime(visit.visitedAt)}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">
        {visit.patientName}
      </span>
      <Badge variant={visit.type === "NEW" ? "outline" : "secondary"}>
        {visitTypeLabel(visit.type)}
      </Badge>
      {visit.reason && (
        <span className="text-muted-foreground hidden max-w-[35%] truncate text-sm sm:block">
          {visit.reason}
        </span>
      )}
    </Link>
  );
}
