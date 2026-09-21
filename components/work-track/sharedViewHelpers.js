export function extractApiResult(json) {
  return json?.result ?? json?.data ?? json?.Result ?? json?.Data ?? null;
}

export function isApiSuccess(json, res) {
  if (!json) return !!res?.ok;
  const code = json.statusCode ?? json.StatusCode;
  if (code === 200 || code === "SUCCESS" || code === "Success") return true;
  if (res?.ok && extractApiResult(json) != null) return true;
  return false;
}

export function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

export function parseChecklistImageUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const trimmed = String(value).trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter((url) => typeof url === "string" && url.trim());
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
}

export function parseOptionsList(item) {
  const list = pick(item, "optionsList", "OptionsList");
  if (Array.isArray(list)) return list;
  const raw = pick(item, "options", "Options");
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
