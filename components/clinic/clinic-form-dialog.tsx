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
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import type { ClinicDTO } from "~/lib/data/types";
import { useCreateClinic, useUpdateClinic } from "~/lib/hooks/use-clinic-admin";

export function ClinicFormDialog({
  open,
  onOpenChange,
  clinic,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic?: ClinicDTO;
}) {
  const mode = clinic ? "edit" : "create";
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const createMut = useCreateClinic();
  const updateMut = useUpdateClinic(clinic?.id ?? "");

  useEffect(() => {
    setName(clinic?.name ?? "");
    setAddress(clinic?.address ?? "");
  }, [clinic]);

  const isPending =
    mode === "create" ? createMut.isPending : updateMut.isPending;

  const submit = () => {
    if (!name.trim()) return;
    const input = { name: name.trim(), address: address.trim() || null };
    const done = { onSuccess: () => onOpenChange(false) };
    if (mode === "create") createMut.mutate(input, done);
    else updateMut.mutate(input, done);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add clinic" : "Edit clinic"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new clinic."
              : "Update this clinic's details."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="clinic-name">Name</FieldLabel>
            <Input
              id="clinic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="clinic-address">Address</FieldLabel>
            <Input
              id="clinic-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
