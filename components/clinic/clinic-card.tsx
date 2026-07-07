"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { ClinicOverview } from "~/lib/data/clinic-admin";
import { ClinicFormDialog } from "./clinic-form-dialog";

export function ClinicCard({ clinic }: { clinic: ClinicOverview }) {
  const [editOpen, setEditOpen] = useState(false);
  const receptionists = clinic.staff
    .filter((s) => s.role === "receptionist")
    .map((s) => s.name);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{clinic.name}</CardTitle>
            <CardDescription>{clinic.address ?? "No address"}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${clinic.name}`}
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="font-semibold">{clinic.patientCount}</span>{" "}
            <span className="text-muted-foreground">patients</span>
          </span>
          <span>
            <span className="font-semibold">{clinic.visitCount}</span>{" "}
            <span className="text-muted-foreground">visits</span>
          </span>
          <span>
            <span className="font-semibold">{clinic.todayVisits}</span>{" "}
            <span className="text-muted-foreground">today</span>
          </span>
        </div>
        <div className="text-muted-foreground">
          Receptionists:{" "}
          <span className="text-foreground">
            {receptionists.length > 0 ? receptionists.join(", ") : "—"}
          </span>
        </div>
      </CardContent>
      <ClinicFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clinic={{ id: clinic.id, name: clinic.name, address: clinic.address }}
      />
    </Card>
  );
}
