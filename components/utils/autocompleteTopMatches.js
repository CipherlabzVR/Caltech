export const DEFAULT_PAGE_SIZE = 5;
export const LOAD_MORE_OPTION = { id: "__load_more__", label: "Load more...", __loadMore: true };

function getLabel(opt) {
  return String(opt?.label || "");
}

// Returns ordered matches (without paging).
export function getTopMatches(options, inputValue) {
  const q = (inputValue || "").trim().toLowerCase();
  if (!q) return options;

  const starts = [];
  const contains = [];

  for (const opt of options) {
    const label = getLabel(opt).toLowerCase();
    if (!label) continue;
    if (label.startsWith(q)) starts.push(opt);
    else if (label.includes(q)) contains.push(opt);
  }

  return [...starts, ...contains];
}

// Use this as MUI Autocomplete filterOptions: shows only `limit` items + "Load more..." when applicable.
export function filterTopMatchesWithLoadMore(options, inputValue, limit, pageSize = DEFAULT_PAGE_SIZE) {
  const safeLimit = Math.max(pageSize, Number(limit) || pageSize);
  const ordered = getTopMatches(options, inputValue);
  // When the user is typing, show only the best matches (no "load more" button).
  if ((inputValue || "").trim().length > 0) {
    return ordered.slice(0, safeLimit);
  }
  // No query: show limited list + "Load more..." affordance.
  if (ordered.length <= safeLimit) return ordered;
  return [...ordered.slice(0, safeLimit), LOAD_MORE_OPTION];
}

// Backwards-compatible helper (no "Load more...").
export function filterTopMatches(options, inputValue, limit = DEFAULT_PAGE_SIZE) {
  const ordered = getTopMatches(options, inputValue);
  return ordered.slice(0, limit);
}

export function withAllOption(options, allowAll = true) {
  return allowAll === false ? options : [{ id: 0, label: "All" }, ...options];
}
