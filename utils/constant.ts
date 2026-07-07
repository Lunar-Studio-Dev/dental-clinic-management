// Seed dataset — single source of truth for Neon (prisma/seed.ts) + Clerk (scripts/seed-clerk.ts).
// Fully DETERMINISTIC (index-based; no Math.random / Date.now) so it is testable and stable.
// Visit timing is expressed as `daysAgo` + `minuteOfDay`; the seed script converts these to
// absolute `visitedAt` timestamps relative to the moment of seeding.
import { BloodGroup, Gender, VisitType } from "~/lib/types";
import type {
  Role,
  SeedClinic,
  SeedPatient,
  SeedUser,
  SeedVisit,
} from "~/utils/constant.schema";

// ── Clinics ──────────────────────────────────────────────────────────────────
export const CLINIC_1_ID = "clinic_1";
export const CLINIC_2_ID = "clinic_2";

export const CLINICS: SeedClinic[] = [
  { id: CLINIC_1_ID, name: "Clinic 1", address: "12 MG Road, Bengaluru" },
  { id: CLINIC_2_ID, name: "Clinic 2", address: "44 Park Street, Kolkata" },
];

// ── Deterministic pools ──────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Asha",
  "Ravi",
  "Priya",
  "Arjun",
  "Meera",
  "Vikram",
  "Sneha",
  "Rohit",
  "Kavya",
  "Anil",
  "Divya",
  "Karan",
  "Neha",
  "Suresh",
  "Pooja",
  "Manish",
  "Ritu",
  "Sanjay",
  "Isha",
  "Deepak",
];
const LAST_NAMES = [
  "Mehta",
  "Kumar",
  "Sharma",
  "Nair",
  "Iyer",
  "Gupta",
  "Reddy",
  "Das",
  "Bose",
  "Patel",
  "Rao",
  "Verma",
  "Joshi",
  "Menon",
  "Khan",
];
const ADDRESSES = [
  "21 Lake View, Pune",
  "7 Rose Lane, Delhi",
  "88 Hill Road, Mumbai",
  "3 Garden St, Chennai",
  "56 River Rd, Hyderabad",
  "9 Sunrise Ave, Jaipur",
];
const HISTORIES = [
  "Hypertension",
  "Type 2 diabetes",
  "Asthma",
  "Hypothyroidism",
  "Migraine",
  "Seasonal allergic rhinitis",
];
const ALLERGIES = [
  "Penicillin",
  "Sulfa drugs",
  "Peanuts",
  "Dust mites",
  "Aspirin",
];
const REASONS = [
  "Fever and body ache",
  "Routine follow-up",
  "Persistent cough",
  "Blood pressure review",
  "Skin rash",
  "Stomach pain",
  "General checkup",
];
const NOTES = [
  "Prescribed rest and fluids; review in 3 days.",
  "Vitals stable. Continue current medication.",
  "Advised blood test; awaiting results.",
  "Symptoms improving; taper dosage.",
];
const BLOOD_GROUPS = [
  BloodGroup.A_POS,
  BloodGroup.A_NEG,
  BloodGroup.B_POS,
  BloodGroup.B_NEG,
  BloodGroup.AB_POS,
  BloodGroup.AB_NEG,
  BloodGroup.O_POS,
  BloodGroup.O_NEG,
  BloodGroup.UNKNOWN,
];

const PATIENT_COUNT = 100;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// ── Patients (100, deterministic) ────────────────────────────────────────────
export const PATIENTS: SeedPatient[] = Array.from(
  { length: PATIENT_COUNT },
  (_, i): SeedPatient => {
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${
      LAST_NAMES[(i * 7) % LAST_NAMES.length]
    }`;
    const gender =
      i % 17 === 0 ? Gender.OTHER : i % 2 === 0 ? Gender.MALE : Gender.FEMALE;

    // Half carry a DOB, half an age — both valid per schema (needs at least one).
    const useDob = i % 3 === 0;
    const birthYear = 1950 + (i % 55);
    const dateOfBirth = useDob
      ? `${birthYear}-${pad2((i % 12) + 1)}-${pad2((i % 27) + 1)}T00:00:00.000Z`
      : null;
    const ageYears = useDob ? null : 18 + ((i * 13) % 70);

    return {
      id: `patient_${pad2(i)}`,
      name,
      dateOfBirth,
      ageYears,
      gender,
      contactNumber: `98${String(10_000_000 + i).padStart(8, "0")}`,
      address: i % 4 === 0 ? null : ADDRESSES[i % ADDRESSES.length],
      medicalHistory: i % 5 === 0 ? HISTORIES[i % HISTORIES.length] : null,
      allergies: i % 6 === 0 ? ALLERGIES[i % ALLERGIES.length] : null,
      bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
      firstClinicId: i % 2 === 0 ? CLINIC_1_ID : CLINIC_2_ID,
    };
  },
);

// ── Visit counts per patient — buckets summing to exactly 500 ─────────────────
// 20×1 (new-only) + 30×3 + 30×5 + 15×8 + 5×24 = 20 + 90 + 150 + 120 + 120 = 500.
const VISIT_COUNT_BUCKETS: Array<[count: number, patients: number]> = [
  [1, 20],
  [3, 30],
  [5, 30],
  [8, 15],
  [24, 5],
];

const VISIT_COUNTS: number[] = VISIT_COUNT_BUCKETS.flatMap(
  ([count, patients]) => Array.from({ length: patients }, () => count),
);

// ── Visits (500, deterministic) ──────────────────────────────────────────────
// For each patient: k=0 is the newest visit, k=count-1 the oldest. The oldest
// (max daysAgo) is typed NEW; the rest FOLLOW_UP. This mirrors the app's derived
// rule ("a visit is NEW if it is the patient's earliest visit").
export const VISITS: SeedVisit[] = (() => {
  const out: SeedVisit[] = [];
  for (let i = 0; i < PATIENTS.length; i++) {
    const patient = PATIENTS[i];
    const count = VISIT_COUNTS[i];
    const newestDaysAgo = i % 30; // i % 30 === 0 → a visit today; 1..6 → this week
    const spacing = 5 + (i % 8); // 5..12 days between a patient's visits
    for (let k = 0; k < count; k++) {
      const isOldest = k === count - 1;
      out.push({
        id: `visit_${pad2(i)}_${pad2(k)}`,
        patientId: patient.id,
        clinicId: patient.firstClinicId,
        type: isOldest ? VisitType.NEW : VisitType.FOLLOW_UP,
        reason: REASONS[(i + k) % REASONS.length],
        notes: k % 2 === 0 ? NOTES[(i + k) % NOTES.length] : null,
        daysAgo: newestDaysAgo + k * spacing,
        minuteOfDay: 9 * 60 + ((i * 7 + k * 23) % 480), // 09:00–17:00
      });
    }
  }
  return out;
})();

// ── Clerk seed users ─────────────────────────────────────────────────────────
export const SEED_USERS: SeedUser[] = [
  {
    email: "reception@clinicos.app",
    password: "Reception#2026",
    firstName: "Riya",
    lastName: "Reception",
    role: "receptionist" satisfies Role,
  },
  {
    email: "doctor@clinicos.app",
    password: "Doctor#2026",
    firstName: "Dev",
    lastName: "Doctor",
    role: "doctor" satisfies Role,
  },
  {
    // A second receptionist left unassigned, to demo the doctor's assign flow.
    email: "reception2@clinicos.app",
    password: "Reception2#2026",
    firstName: "Sam",
    lastName: "Kapoor",
    role: "receptionist" satisfies Role,
  },
];
