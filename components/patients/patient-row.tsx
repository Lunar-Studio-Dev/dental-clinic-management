import Link from "next/link";
import type { PatientListItem } from "~/lib/data/types";
import { patientAge } from "~/lib/patient-utils";
import type { Gender } from "~/lib/types";
import { PatientStatusBadge } from "./patient-status-badge";

const GENDER_SHORT: Record<Gender, string> = {
  MALE: "M",
  FEMALE: "F",
  OTHER: "—",
};

// A patient list item rendered as a clickable link-row (responsive).
export function PatientRow({
  patient,
  now = new Date(),
}: {
  patient: PatientListItem;
  now?: Date;
}) {
  const age = patientAge(patient, now);

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="hover:bg-muted/60 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors"
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{patient.name}</div>
        <div className="text-muted-foreground flex flex-wrap gap-1.5 text-sm">
          <span>
            {age ?? "—"} · {GENDER_SHORT[patient.gender]}
          </span>
          <span aria-hidden>·</span>
          <span>{patient.contactNumber}</span>
        </div>
      </div>
      <PatientStatusBadge visitCount={patient.visitCount} />
    </Link>
  );
}
