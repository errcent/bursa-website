import {
  L1_EXPERTISE_OPTIONS,
  L1_YEARS_OPTIONS,
} from "@/lib/mentor-program/fields";

export const L1_ADMIN_FIELDS: Array<{ id: string; label: string }> = [
  { id: "l1_full_name", label: "Nama lengkap" },
  { id: "l1_email", label: "Email" },
  { id: "l1_country", label: "Negara" },
  { id: "l1_city", label: "Kota" },
  { id: "l1_linkedin_url", label: "LinkedIn" },
  { id: "l1_website_url", label: "Situs / profil lain" },
  { id: "l1_expertise", label: "Keahlian" },
  { id: "l1_expertise_other", label: "Keahlian lainnya" },
  { id: "l1_primary_expertise", label: "Keahlian utama" },
  { id: "l1_years_experience", label: "Pengalaman" },
  { id: "l1_professional_background", label: "Latar belakang profesional" },
  { id: "l1_why_bursanalar", label: "Mengapa Bursanalar" },
  { id: "l1_unique_knowledge", label: "Yang jarang dari kursus biasa" },
  { id: "l1_extra_links", label: "Tautan tambahan" },
];

const SKIP_L1_KEYS = new Set(["l1_confirmation", "turnstileToken"]);

function expertiseLabel(value: string) {
  return L1_EXPERTISE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function yearsLabel(value: string) {
  return L1_YEARS_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function hasMeaningfulL1Answers(data: Record<string, unknown> | null | undefined) {
  if (!data) return false;
  return L1_ADMIN_FIELDS.some((field) => {
    const value = data[field.id];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return value != null && value !== false;
  });
}

export function l1PrimaryPreview(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;
  const primary = typeof data.l1_primary_expertise === "string" ? data.l1_primary_expertise : "";
  const years = typeof data.l1_years_experience === "string" ? data.l1_years_experience : "";
  const parts = [
    primary ? expertiseLabel(primary) : null,
    years ? yearsLabel(years) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function formatL1AdminValue(fieldId: string, value: unknown): string {
  if (value == null || value === "") return "";
  if (fieldId === "l1_years_experience" && typeof value === "string") {
    return yearsLabel(value);
  }
  if (fieldId === "l1_primary_expertise" && typeof value === "string") {
    return expertiseLabel(value);
  }
  if (fieldId === "l1_expertise" && Array.isArray(value)) {
    return value.map((item) => expertiseLabel(String(item))).join(", ");
  }
  if (fieldId === "l1_extra_links" && Array.isArray(value)) {
    return value.map(String).join("\n");
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return JSON.stringify(value);
}

export function l1AdminRows(data: Record<string, unknown> | null | undefined) {
  if (!data) return [];
  const rows = L1_ADMIN_FIELDS.map((field) => ({
    id: field.id,
    label: field.label,
    value: formatL1AdminValue(field.id, data[field.id]),
  })).filter((row) => row.value.trim().length > 0);

  const known = new Set(L1_ADMIN_FIELDS.map((field) => field.id));
  for (const [key, value] of Object.entries(data)) {
    if (known.has(key) || SKIP_L1_KEYS.has(key)) continue;
    const formatted = formatL1AdminValue(key, value);
    if (!formatted.trim()) continue;
    rows.push({ id: key, label: key, value: formatted });
  }
  return rows;
}
