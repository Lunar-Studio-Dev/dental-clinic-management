// One-way backfill: mirror all Clerk staff users into the DB `Staff` table.
// Runs without webhooks (uses the Clerk backend list API) — use for initial
// population and local dev. Webhooks keep it in sync going forward.
// Preserves existing clinic assignments (upsert never touches clinicId).
// Run: pnpm sync:staff
import "~/scripts/load-env";

import { createClerkClient } from "@clerk/backend";
import { prisma } from "~/lib/prisma";

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set in .env.local");
  const clerk = createClerkClient({ secretKey });

  const { data: users } = await clerk.users.getUserList({ limit: 200 });
  let synced = 0;

  for (const u of users) {
    const role = u.publicMetadata?.role;
    if (role !== "receptionist" && role !== "doctor") continue; // staff only
    const email =
      u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress;
    if (!email) continue;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || email;

    await prisma.staff.upsert({
      where: { id: u.id },
      create: { id: u.id, email, name, role },
      update: { email, name, role }, // clinicId intentionally preserved
    });
    synced += 1;
  }

  const rows = await prisma.staff.findMany({
    select: { name: true, role: true, clinicId: true },
  });
  console.log(`Synced ${synced} staff into DB:`);
  for (const r of rows) {
    console.log(
      `  ${r.role.padEnd(12)} ${r.name}  → clinic: ${r.clinicId ?? "unassigned"}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Staff sync failed:", err);
    process.exit(1);
  });
