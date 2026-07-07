import type { Metadata } from "next";
import { FadeIn } from "~/components/motion/fade-in";
import { VisitsPage } from "~/components/visits/visits-page";

export const metadata: Metadata = { title: "Visits · ClinicOS" };

export default function Page() {
  return (
    <FadeIn>
      <VisitsPage />
    </FadeIn>
  );
}
