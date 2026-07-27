/**
 * Labels for onboarding list/detail. Prefer API `employeeDisplayName` / `profileDisplayName`
 * (populated by backend for candidate-based rows and profile title).
 */
export function getOnboardingEmployeeLabel(row) {
  if (!row) return "—";
  const api = row.employeeDisplayName ?? row.EmployeeDisplayName;
  if (api != null && String(api).trim() !== "") return String(api).trim();

  const ep = row.employeeProfile ?? row.EmployeeProfile;
  if (ep) {
    const fromFull = ep.fullName ?? ep.FullName;
    if (fromFull != null && String(fromFull).trim() !== "") return String(fromFull).trim();
    const composed = `${ep.firstName ?? ep.FirstName ?? ""} ${ep.lastName ?? ep.LastName ?? ""}`.trim();
    if (composed) return composed;
  }

  const c = row.candidate ?? row.Candidate;
  if (c) {
    const composed = `${c.firstName ?? c.FirstName ?? ""} ${c.lastName ?? c.LastName ?? ""}`.trim();
    if (composed) return composed;
  }

  const eid = row.employeeProfileId ?? row.EmployeeProfileId;
  if (eid != null && eid !== "" && !Number.isNaN(Number(eid))) {
    return `Employee #${eid}`;
  }
  return "—";
}

export function getOnboardingProfileLabel(row) {
  if (!row) return "—";
  const api = row.profileDisplayName ?? row.ProfileDisplayName;
  if (api != null && String(api).trim() !== "") return String(api).trim();

  const p = row.profile ?? row.Profile;
  const n = p?.name ?? p?.Name;
  if (n != null && String(n).trim() !== "") return String(n).trim();

  return "—";
}
