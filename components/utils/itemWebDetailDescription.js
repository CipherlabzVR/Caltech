export const ITEM_WEB_DETAIL_MARKER = "<<<APEXFLOW_ITEM_WEB_DETAIL_v1>>>";

/** Saved format from merge (newlines + marker + JSON). */
export const ITEM_WEB_DETAIL_SENTINEL =
  "\n<<<APEXFLOW_ITEM_WEB_DETAIL_v1>>>\n";

/**
 * @returns {{ plain: string, features: string, specifications: string, warranty: string }}
 */
export function parseItemWebDetailDescription(raw) {
  const s = raw == null ? "" : String(raw);
  const normalized = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const markerIdx = normalized.indexOf(ITEM_WEB_DETAIL_MARKER);
  if (markerIdx < 0) {
    return {
      plain: normalized.trimEnd(),
      features: "",
      specifications: "",
      warranty: "",
    };
  }

  const plain = normalized.slice(0, markerIdx).trimEnd();
  let rest = normalized.slice(markerIdx + ITEM_WEB_DETAIL_MARKER.length);
  rest = rest.replace(/^[\s\uFEFF]+/, "");

  let features = "";
  let specifications = "";
  let warranty = "";

  const jsonStart = rest.indexOf("{");
  if (jsonStart >= 0) {
    const jsonCandidate = rest.slice(jsonStart).trim();
    try {
      const j = JSON.parse(jsonCandidate);
      if (j && typeof j === "object") {
        features = typeof j.features === "string" ? j.features : "";
        specifications =
          typeof j.specifications === "string" ? j.specifications : "";
        warranty = typeof j.warranty === "string" ? j.warranty : "";
      }
    } catch {
      /* malformed JSON */
    }
  }

  return { plain, features, specifications, warranty };
}

/**
 * @param {{ features?: string, specifications?: string, warranty?: string }} parts
 */
export function mergeItemWebDetailDescription(plain, parts) {
  const base = plain == null ? "" : String(plain).trimEnd();
  const features = (parts.features ?? "").trim();
  const specifications = (parts.specifications ?? "").trim();
  const warranty = (parts.warranty ?? "").trim();
  if (!features && !specifications && !warranty) return base;
  const payload = JSON.stringify({ features, specifications, warranty });
  return base + ITEM_WEB_DETAIL_SENTINEL + payload;
}
