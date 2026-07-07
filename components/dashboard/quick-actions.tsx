"use client";

import { CalendarPlus, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PatientFormSheet } from "~/components/patients/patient-form-sheet";
import { Button } from "~/components/ui/button";
import { NewVisitDialog } from "~/components/visits/new-visit-dialog";

export function QuickActions({ clinicId }: { clinicId: string | null }) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setRegisterOpen(true)}>
        <UserPlus data-icon="inline-start" />
        Register
      </Button>
      <Button variant="outline" render={<Link href="/patients" />}>
        <Search data-icon="inline-start" />
        Search
      </Button>
      <Button variant="outline" onClick={() => setVisitOpen(true)}>
        <CalendarPlus data-icon="inline-start" />
        New Visit
      </Button>

      <PatientFormSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        mode="create"
        defaultClinicId={clinicId}
      />
      <NewVisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        clinicId={clinicId}
      />
    </div>
  );
}
