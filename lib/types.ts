// Single shared source of domain types + enums, re-exported from the generated
// Prisma client so constants, the data-access seam, and UI all reference one shape.
export type { Clinic, Patient, Visit } from "~/lib/generated/prisma/client";
// Enums are both runtime const objects AND types (same name) — re-export carries both.
export { BloodGroup, Gender, VisitType } from "~/lib/generated/prisma/client";
