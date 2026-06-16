export interface Preset {
  id: string;
  label: string;
  purpose: string;
}

export const PRESETS: Preset[] = [
  { id: "blank", label: "Custom", purpose: "" },
  { id: "kyc", label: "KYC / Identity verification", purpose: "KYC verification" },
  { id: "bank", label: "Bank account opening", purpose: "Bank account opening" },
  { id: "loan", label: "Loan application", purpose: "Loan application" },
  { id: "ewallet", label: "E-wallet verification", purpose: "E-wallet verification" },
  { id: "rental", label: "Rental application", purpose: "Rental application" },
  { id: "employment", label: "Employment verification", purpose: "Employment verification" },
  { id: "tax", label: "Tax filing", purpose: "Tax filing" },
];

export function buildWatermarkText(
  purpose: string,
  includeDate = true,
  includeHash = "",
  date?: Date,
): string {
  const parts: string[] = [];
  if (purpose.trim()) parts.push(purpose.trim());
  if (includeDate) {
    const d = date ?? new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    parts.push(`${dd}-${mm}-${yyyy}`);
  }
  if (includeHash) parts.push(`#${includeHash}`);
  return parts.join(" · ");
}
