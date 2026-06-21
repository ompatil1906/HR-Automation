export type ColumnKey = "hrName" | "hrEmail" | "companyName" | "companyWebsite" | "linkedinUrl" | "notes";

const aliases: Record<ColumnKey, string[]> = {
  hrName: ["hr name", "recruiter name", "contact name", "name", "hr"],
  hrEmail: ["hr email", "email address", "work email", "recruiter email", "email", "mail"],
  companyName: ["company name", "organisation name", "organization name", "employer", "company", "organisation"],
  companyWebsite: ["company website", "website url", "official website", "website", "domain"],
  linkedinUrl: ["linkedin url", "company linkedin", "linkedin profile", "linkedin"],
  notes: ["extra note", "remarks", "comment", "notes", "note"],
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export function detectColumns(headers: string[]): Partial<Record<ColumnKey, string>> {
  const normalized = headers.map((header) => ({ header, normalized: normalize(header) }));
  const result: Partial<Record<ColumnKey, string>> = {};
  for (const [key, choices] of Object.entries(aliases) as [ColumnKey, string[]][]) {
    const exact = normalized.find((item) => choices.includes(item.normalized));
    const fuzzy = normalized.find((item) => choices.some((alias) => item.normalized.includes(alias)));
    const match = exact || fuzzy;
    if (match && !Object.values(result).includes(match.header)) result[key] = match.header;
  }
  return result;
}
