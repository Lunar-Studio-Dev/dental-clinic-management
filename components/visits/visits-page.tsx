"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "~/components/error-state";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import type { VisitRange } from "~/lib/data/visits";
import { useActiveClinicId } from "~/lib/hooks/use-active-clinic";
import { useClinics } from "~/lib/hooks/use-clinics";
import { useVisits } from "~/lib/hooks/use-visits";
import { NewVisitDialog } from "./new-visit-dialog";
import { VisitListItem } from "./visit-list-item";

const SKELETONS = ["a", "b", "c"];

function VisitSection({
  title,
  clinicId,
  range,
  emptyText,
}: {
  title: string;
  clinicId: string | null;
  range: VisitRange;
  emptyText: string;
}) {
  const { data, isLoading, isError, refetch } = useVisits(clinicId, range);
  const visits = data?.visits ?? [];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {isError ? (
        <ErrorState title="Couldn't load visits" onRetry={() => refetch()} />
      ) : isLoading || !clinicId ? (
        <div className="flex flex-col gap-2">
          {SKELETONS.map((k) => (
            <Skeleton key={`${range}-${k}`} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{emptyText}</EmptyTitle>
            <EmptyDescription>Nothing to show here yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {visits.map((v) => (
            <VisitListItem key={v.id} visit={v} />
          ))}
        </div>
      )}
    </section>
  );
}

export function VisitsPage() {
  const { data: clinics } = useClinics();
  const clinicId = useActiveClinicId(clinics ?? []);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Visits</h1>
        <Button size="lg" onClick={() => setNewOpen(true)}>
          <CalendarPlus data-icon="inline-start" />
          New Visit
        </Button>
      </div>

      <VisitSection
        title="Today"
        clinicId={clinicId}
        range="today"
        emptyText="No visits today"
      />
      <VisitSection
        title="Recent"
        clinicId={clinicId}
        range="recent"
        emptyText="No recent visits"
      />

      <NewVisitDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        clinicId={clinicId}
      />
    </div>
  );
}
