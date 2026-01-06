export const DEFAULT_DELIVERY_TYPE_OPTIONS = [
  { value: 1, label: "Standard" },
  { value: 2, label: "Express" },
  { value: 3, label: "Same Day" },
  { value: 4, label: "International" },
];

const toOptionArray = (entries) =>
  entries
    .map(([value, label]) => {
      const numericValue = Number(value);
      if (!label) {
        return null;
      }

      return {
        value: Number.isNaN(numericValue) ? value : numericValue,
        label: String(label),
      };
    })
    .filter(Boolean);

export const normalizeDeliveryTypeOptions = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          return { value: item, label: item };
        }
        if (typeof item === "object") {
          if (item.value !== undefined && item.label) {
            return {
              value: item.value,
              label: item.label,
            };
          }
          if (item.key !== undefined && item.value) {
            return {
              value: item.key,
              label: item.value,
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  }

  if (payload.result) {
    return normalizeDeliveryTypeOptions(payload.result);
  }

  if (payload.data) {
    return normalizeDeliveryTypeOptions(payload.data);
  }

  if (payload.items && Array.isArray(payload.items)) {
    return normalizeDeliveryTypeOptions(payload.items);
  }

  if (typeof payload === "object") {
    return toOptionArray(Object.entries(payload));
  }

  return [];
};

export const getDeliveryTypeLabel = (value, options = DEFAULT_DELIVERY_TYPE_OPTIONS) => {
  if (value === null || value === undefined) {
    return "-";
  }

  const numericValue = Number(value);
  const match =
    options.find((option) => Number(option.value) === numericValue) ||
    options.find((option) => option.value === value);

  return match ? match.label : `Type ${value}`;
};

