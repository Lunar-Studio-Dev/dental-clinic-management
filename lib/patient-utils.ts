// Age is derived from dateOfBirth when present, else the stored ageYears.
export function patientAge(
  p: { dateOfBirth: string | null; ageYears: number | null },
  now: Date,
): number | null {
  if (p.dateOfBirth) {
    const dob = new Date(p.dateOfBirth);
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  }
  return p.ageYears ?? null;
}

// A patient is "returning" once they have 2+ visits (matches the KPI rule).
export function isReturning(visitCount: number): boolean {
  return visitCount >= 2;
}
