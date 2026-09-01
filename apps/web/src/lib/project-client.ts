export const UNASSIGNED_PROJECT_CLIENT_NAME = "Client Not Assigned";

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeSubmittedProjectClientName(value: unknown) {
  return normalizeOptionalText(value) ?? UNASSIGNED_PROJECT_CLIENT_NAME;
}

export function resolveProjectClientName({
  clientNameOverride,
  linkedClientName,
  linkedClientEmail,
  administratorEmail,
}: {
  clientNameOverride: unknown;
  linkedClientName: unknown;
  linkedClientEmail?: unknown;
  administratorEmail?: unknown;
}) {
  const overrideName = normalizeOptionalText(clientNameOverride);
  if (overrideName) return overrideName;

  const normalizedClientEmail = normalizeOptionalText(linkedClientEmail)?.toLowerCase();
  const normalizedAdministratorEmail = normalizeOptionalText(administratorEmail)?.toLowerCase();

  // Older intake records linked projects to the submitting administrator's
  // client profile even when no project client was supplied.
  if (normalizedClientEmail && normalizedClientEmail === normalizedAdministratorEmail) {
    return UNASSIGNED_PROJECT_CLIENT_NAME;
  }

  return normalizeOptionalText(linkedClientName) ?? UNASSIGNED_PROJECT_CLIENT_NAME;
}
