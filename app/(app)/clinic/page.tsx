import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClinicManagement } from "~/components/clinic/clinic-management";
import { FadeIn } from "~/components/motion/fade-in";
import { getRole } from "~/lib/auth";

export const metadata: Metadata = { title: "Clinic · ClinicOS" };

// Doctor-only route (matches the doctor-scoped sidebar item). Non-doctors are
// redirected so the URL can't be reached directly.
export default async function ClinicPage() {
  const role = await getRole();
  if (role !== "doctor") redirect("/dashboard");

  return (
    <FadeIn>
      <ClinicManagement />
    </FadeIn>
  );
}
