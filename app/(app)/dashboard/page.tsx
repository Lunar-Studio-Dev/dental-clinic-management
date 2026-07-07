import type { Metadata } from "next";
import { DoctorDashboard } from "~/components/dashboard/doctor-dashboard";
import { ReceptionDashboard } from "~/components/dashboard/reception-dashboard";
import { FadeIn } from "~/components/motion/fade-in";
import { getRole } from "~/lib/auth";

export const metadata: Metadata = { title: "Dashboard · ClinicOS" };

// Role-locked: doctors get the doctor dashboard; everyone else the reception one.
export default async function DashboardPage() {
  const role = await getRole();
  return (
    <FadeIn>
      {role === "doctor" ? <DoctorDashboard /> : <ReceptionDashboard />}
    </FadeIn>
  );
}
