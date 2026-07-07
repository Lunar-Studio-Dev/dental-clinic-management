"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useCreateVisit } from "~/lib/hooks/use-visit-mutations";
import { PatientPicker, type PickedPatient } from "./patient-picker";

export function NewVisitDialog({
  open,
  onOpenChange,
  clinicId,
  patient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string | null;
  patient?: PickedPatient; // pre-filled when launched from a profile
}) {
  const [selected, setSelected] = useState<PickedPatient | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateVisit();

  const effectivePatient = patient ?? selected;

  const reset = () => {
    setSelected(null);
    setReason("");
    setNotes("");
    setError(null);
  };

  const submit = () => {
    if (!effectivePatient) return setError("Select a patient.");
    if (!reason.trim()) return setError("Reason is required.");
    if (!clinicId) return setError("No clinic selected.");
    setError(null);
    createMut.mutate(
      {
        patientId: effectivePatient.id,
        clinicId,
        reason: reason.trim(),
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New visit</DialogTitle>
          <DialogDescription>
            Record a visit. The type (New / Follow-up) is set automatically.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Patient</FieldLabel>
            {patient ? (
              <div className="rounded-lg border px-3 py-2 font-medium">
                {patient.name}
              </div>
            ) : (
              <PatientPicker
                clinicId={clinicId}
                value={selected}
                onSelect={setSelected}
              />
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="reason">Reason</FieldLabel>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Fever and body ache"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createMut.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
