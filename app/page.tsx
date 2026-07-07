import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { getRole } from "~/lib/auth";

// Phase 0 placeholder — protected by Clerk middleware. Verifies auth end-to-end
// (sign-in redirect, session, role metadata, sign-out). The real app shell is Phase 1.
export default async function Home() {
  const user = await currentUser();
  const role = await getRole();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ClinicOS</h1>
        <UserButton />
      </div>
      <p className="text-muted-foreground text-sm">
        Signed in as {user?.primaryEmailAddress?.emailAddress ?? "unknown"}
      </p>
      <p className="text-sm">
        Role: <span className="font-medium">{role ?? "— (not set)"}</span>
      </p>
      <p className="text-muted-foreground text-sm">
        Phase 0 foundation ready. The app shell arrives in Phase 1.
      </p>
    </main>
  );
}
