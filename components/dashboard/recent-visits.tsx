import { VisitListItem } from "~/components/visits/visit-list-item";
import type { VisitListItem as VisitListItemT } from "~/lib/data/types";

export function RecentVisits({ visits }: { visits: VisitListItemT[] }) {
  if (visits.length === 0) {
    return <p className="text-muted-foreground text-sm">No recent visits.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {visits.map((v) => (
        <VisitListItem key={v.id} visit={v} />
      ))}
    </div>
  );
}
