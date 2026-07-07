import { format } from "date-fns";
import { NotebookPen } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import type { VisitDTO } from "~/lib/data/types";

const TYPE_LABEL: Record<string, string> = {
  NEW: "New",
  FOLLOW_UP: "Follow-up",
};

// Timeline (newest-first). If `onAddNote` is provided (doctor), each visit gets a
// note action; the caller decides whether to pass it based on role.
export function VisitTimeline({
  visits,
  onAddNote,
}: {
  visits: VisitDTO[];
  onAddNote?: (visit: VisitDTO) => void;
}) {
  if (visits.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No visits yet</EmptyTitle>
          <EmptyDescription>
            This patient has no recorded visits.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ol className="flex flex-col gap-4 border-l pl-5">
      {visits.map((v) => (
        <li key={v.id} className="relative flex flex-col gap-1">
          <span className="bg-primary absolute top-1.5 -left-[23px] size-2 rounded-full" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">
              {format(new Date(v.visitedAt), "dd MMM yyyy")}
            </span>
            <Badge variant={v.type === "NEW" ? "outline" : "secondary"}>
              {TYPE_LABEL[v.type] ?? v.type}
            </Badge>
            {v.reason && (
              <span className="text-muted-foreground flex gap-1.5">
                <span aria-hidden>·</span>
                <span>{v.reason}</span>
              </span>
            )}
            {onAddNote && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => onAddNote(v)}
              >
                <NotebookPen data-icon="inline-start" />
                {v.notes ? "Edit note" : "Add note"}
              </Button>
            )}
          </div>
          {v.notes && (
            <p className="text-muted-foreground text-sm">{v.notes}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
