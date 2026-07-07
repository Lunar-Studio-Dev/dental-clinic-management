import type { Metadata } from "next";
import { FadeIn } from "~/components/motion/fade-in";
import { PatientsPage } from "~/components/patients/patients-page";

export const metadata: Metadata = { title: "Patients · ClinicOS" };

export default function Page() {
  return (
    <FadeIn>
      <PatientsPage />
    </FadeIn>
  );
}
