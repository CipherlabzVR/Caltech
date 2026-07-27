import BASE_URL from "Base/api";
import { createAuthHeaders } from "@/components/utils/apiHelpers";

/**
 * Loads letterhead image URL for a company (GetCompanyById).
 * Uses query id + JSON body for compatibility with the API.
 * @param {string|number|null|undefined} rawCompanyId
 * @returns {Promise<string|null>}
 */
export async function fetchCompanyLetterheadUrl(rawCompanyId) {
  if (rawCompanyId === "" || rawCompanyId == null) return null;
  const id = Number(rawCompanyId);
  if (Number.isNaN(id)) return null;
  try {
    const res = await fetch(
      `${BASE_URL}/Company/GetCompanyById?id=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({ id }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.result ?? data?.Result;
    if (!r) return null;
    const url =
      (typeof r.letterHeadImage === "string" && r.letterHeadImage.trim()) ||
      (typeof r.LetterHeadImage === "string" && r.LetterHeadImage.trim()) ||
      null;
    return url || null;
  } catch {
    return null;
  }
}
