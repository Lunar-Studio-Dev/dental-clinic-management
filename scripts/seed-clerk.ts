// Seeds the two demo users into Clerk with publicMetadata.role. Idempotent:
// updates the user if the email already exists. Run: pnpm seed:clerk
import "~/scripts/load-env";

import { createClerkClient } from "@clerk/backend";
import { SEED_USERS } from "~/utils/constant";

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set in .env.local");

  const clerk = createClerkClient({ secretKey });

  for (const u of SEED_USERS) {
    const existing = await clerk.users.getUserList({ emailAddress: [u.email] });

    if (existing.data.length > 0) {
      const id = existing.data[0].id;
      await clerk.users.updateUser(id, {
        firstName: u.firstName,
        lastName: u.lastName,
        publicMetadata: { role: u.role },
      });
      console.log(`updated ${u.role}: ${u.email}`);
    } else {
      await clerk.users.createUser({
        emailAddress: [u.email],
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        publicMetadata: { role: u.role },
        skipPasswordChecks: true,
      });
      console.log(`created ${u.role}: ${u.email}`);
    }
  }

  console.log("\nSeed credentials (share with the user):");
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(12)} ${u.email}  /  ${u.password}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Clerk seed failed:", err);
    process.exit(1);
  });
