import { getJson } from "~/lib/data/http";
import type { Role } from "~/utils/constant.schema";

export interface MyClinic {
  role: Role | null;
  canSwitch: boolean;
  clinicId: string | null;
  clinicName: string | null;
}

export const meRepo = {
  clinic: (): Promise<MyClinic> => getJson<MyClinic>("/api/me/clinic"),
};
