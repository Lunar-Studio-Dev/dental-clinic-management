"use client";

import {
  ArrowLeft,
  Building2,
  ClipboardList,
  MapPin,
  Pencil,
  Phone,
  Plus,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "~/components/error-state";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { NewVisitDialog } from "~/components/visits/new-visit-dialog";
import { VisitNoteDialog } from "~/components/visits/visit-note-dialog";
import type { VisitDTO } from "~/lib/data/types";
import { useClinics } from "~/lib/hooks/use-clinics";
import { usePatient } from "~/lib/hooks/use-patient";
import { useRole } from "~/lib/hooks/use-role";
import { patientAge } from "~/lib/patient-utils";
import type { BloodGroup, Gender } from "~/lib/types";
import { PatientFormSheet } from "./patient-form-sheet";
import { PatientStatusBadge } from "./patient-status-badge";
import { VisitTimeline } from "./visit-timeline";

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};
const BLOOD_LABEL: Record<BloodGroup, string> = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
  O_POS: "O+",
  O_NEG: "O−",
  UNKNOWN: "Unknown",
};

export function PatientProfile({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = usePatient(id);
  const { data: clinics } = useClinics();
  const role = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [noteVisit, setNoteVisit] = useState<VisitDTO | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load patient"
        description="This patient may have been removed, or the request failed."
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Patient not found</EmptyTitle>
          <EmptyDescription>
            <Link href="/patients" className="underline">
              Back to patients
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { patient, visits } = data;
  const age = patientAge(patient, new Date());
  const clinicName =
    clinics?.find((c) => c.id === patient.firstClinicId)?.name ??
    patient.firstClinicId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/patients" />}>
          <ArrowLeft data-icon="inline-start" />
          Patients
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <Button onClick={() => setNewVisitOpen(true)}>
            <Plus data-icon="inline-start" />
            New Visit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{patient.name}</CardTitle>
              <PatientStatusBadge visitCount={visits.length} />
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
            <div className="text-foreground">
              {age ?? "—"} · {GENDER_LABEL[patient.gender]} ·{" "}
              {BLOOD_LABEL[patient.bloodGroup]}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              {patient.contactNumber}
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="size-4 shrink-0" />
              First: {clinicName}
            </div>
            {patient.allergies && (
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-4 shrink-0" />
                {patient.allergies}
              </div>
            )}
            {patient.medicalHistory && (
              <div className="flex items-center gap-2">
                <ClipboardList className="size-4 shrink-0" />
                {patient.medicalHistory}
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" />
                {patient.address}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Visit timeline</h2>
          <VisitTimeline
            visits={visits}
            onAddNote={role === "doctor" ? setNoteVisit : undefined}
          />
        </div>
      </div>

      <PatientFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        patient={patient}
      />
      <NewVisitDialog
        open={newVisitOpen}
        onOpenChange={setNewVisitOpen}
        clinicId={patient.firstClinicId}
        patient={{ id: patient.id, name: patient.name }}
      />
      <VisitNoteDialog
        open={!!noteVisit}
        onOpenChange={(o) => !o && setNoteVisit(null)}
        visit={noteVisit}
        patientId={patient.id}
      />
    </div>
  );
}
