import type { Metadata } from "next";
import { FadeIn } from "~/components/motion/fade-in";
import { PatientProfile } from "~/components/patients/patient-profile";

export const metadata: Metadata = { title: "Patient · ClinicOS" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <FadeIn>
      <PatientProfile id={id} />
    </FadeIn>
  );
}
