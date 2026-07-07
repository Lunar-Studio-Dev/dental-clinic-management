"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import type { VisitDTO } from "~/lib/data/types";
import { useAddVisitNote } from "~/lib/hooks/use-visit-mutations";
import { formatVisitDate } from "~/lib/visit-utils";

// Doctor-only note editor for a single visit.
export function VisitNoteDialog({
  open,
  onOpenChange,
  visit,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitDTO | null;
  patientId?: string;
}) {
  const [notes, setNotes] = useState("");
  const mut = useAddVisitNote(patientId);

  // Sync the field whenever a different visit is opened.
  useEffect(() => {
    setNotes(visit?.notes ?? "");
  }, [visit]);

  if (!visit) return null;

  const submit = () => {
    mut.mutate(
      { id: visit.id, notes },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Visit note · {formatVisitDate(visit.visitedAt)}
          </DialogTitle>
          <DialogDescription>{visit.reason ?? "Visit"}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Clinical notes…"
          rows={5}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mut.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
