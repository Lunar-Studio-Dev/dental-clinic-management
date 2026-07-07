// Single shared source of domain types + enums.
// Model TYPES come from the generated client (type-only import → fully erased, so it
// does NOT pull the server-only Prisma runtime into client bundles).
export type { Clinic, Patient, Visit } from "~/lib/generated/prisma/client";
// Enum VALUES come from the standalone, import-free `enums` file (browser-safe) —
// importing them from `client` would drag `node:module` into the client bundle.
export { BloodGroup, Gender, VisitType } from "~/lib/generated/prisma/enums";
