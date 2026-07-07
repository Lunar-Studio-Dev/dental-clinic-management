"use client";

import { UserPlus } from "lucide-react";
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
import { useClinics } from "~/lib/hooks/use-clinics";
import { useCurrentClinicId } from "~/lib/hooks/use-current-clinic";
import { useDebouncedValue } from "~/lib/hooks/use-debounced-value";
import { usePatients } from "~/lib/hooks/use-patients";
import { PatientFormSheet } from "./patient-form-sheet";
import { PatientRow } from "./patient-row";
import { PatientSearchInput } from "./patient-search-input";

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5", "s6"];

export function PatientsPage() {
  const { data: clinics } = useClinics();
  const clinicId = useCurrentClinicId(clinics ?? []);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const query = usePatients(clinicId, debouncedQ);
  const [registerOpen, setRegisterOpen] = useState(false);

  const patients = query.data?.pages.flatMap((p) => p.patients) ?? [];
  const showSkeletons = query.isLoading || !clinicId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Button size="lg" onClick={() => setRegisterOpen(true)}>
          <UserPlus data-icon="inline-start" />
          Register
        </Button>
      </div>

      <PatientSearchInput value={q} onChange={setQ} />

      {query.isError ? (
        <ErrorState
          title="Couldn't load patients"
          onRetry={() => query.refetch()}
        />
      ) : showSkeletons ? (
        <div className="flex flex-col gap-2">
          {SKELETON_ROWS.map((k) => (
            <Skeleton key={k} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {debouncedQ ? "No matching patients" : "No patients yet"}
            </EmptyTitle>
            <EmptyDescription>
              {debouncedQ
                ? `No patients match “${debouncedQ}”.`
                : "Register the first patient for this clinic."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {patients.map((p) => (
            <PatientRow key={p.id} patient={p} />
          ))}
        </div>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="self-center"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}

      <PatientFormSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        mode="create"
        defaultClinicId={clinicId}
      />
    </div>
  );
}
