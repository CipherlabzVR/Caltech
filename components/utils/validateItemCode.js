import BASE_URL from "Base/api";

/**
 * Returns whether an item code is available (not used by another item).
 * @param {string} code
 * @param {number|string|null} excludeItemId - current item id when editing
 */
export async function isItemCodeAvailable(code, excludeItemId = null) {
  const trimmed = (code || "").trim();
  if (!trimmed) {
    return { available: true };
  }

  const params = new URLSearchParams({
    SkipCount: "0",
    MaxResultCount: "100",
    Search: trimmed,
  });

  try {
    const response = await fetch(
      `${BASE_URL}/Items/GetAllItemsSkipAndTake?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { available: true, unchecked: true };
    }

    const data = await response.json();
    const items = data?.result?.items ?? data?.result?.Items ?? [];
    const normalized = trimmed.toUpperCase();
    const conflict = items.find((entry) => {
      const itemCode = String(entry.code ?? entry.Code ?? "")
        .trim()
        .toUpperCase();
      if (itemCode !== normalized) {
        return false;
      }
      if (excludeItemId == null || excludeItemId === "") {
        return true;
      }
      const itemId = entry.id ?? entry.Id;
      return Number(itemId) !== Number(excludeItemId);
    });

    return { available: !conflict };
  } catch {
    return { available: true, unchecked: true };
  }
}
