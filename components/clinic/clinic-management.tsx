"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "~/components/error-state";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useClinicOverview,
  useReceptionists,
} from "~/lib/hooks/use-clinic-admin";
import { useClinics } from "~/lib/hooks/use-clinics";
import { ClinicCard } from "./clinic-card";
import { ClinicFormDialog } from "./clinic-form-dialog";
import { StaffAssignSelect } from "./staff-assign-select";

const CARD_SKELETONS = ["a", "b"];

export function ClinicManagement() {
  const overview = useClinicOverview();
  const receptionists = useReceptionists();
  const { data: clinics } = useClinics();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Clinic Management</h1>

      <Tabs defaultValue="clinics">
        <TabsList>
          <TabsTrigger value="clinics">Clinics</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="clinics" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddOpen(true)}>
              <Plus data-icon="inline-start" />
              Add clinic
            </Button>
          </div>
          {overview.isError ? (
            <ErrorState
              title="Couldn't load clinics"
              onRetry={() => overview.refetch()}
            />
          ) : overview.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {CARD_SKELETONS.map((k) => (
                <Skeleton key={k} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {overview.data?.clinics.map((c) => (
                <ClinicCard key={c.id} clinic={c} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="staff" className="flex flex-col gap-4">
          {receptionists.isError ? (
            <ErrorState
              title="Couldn't load staff"
              onRetry={() => receptionists.refetch()}
            />
          ) : receptionists.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead>Assigned clinic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receptionists.data?.staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {s.email}
                      </TableCell>
                      <TableCell>
                        <StaffAssignSelect staff={s} clinics={clinics ?? []} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ClinicFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
