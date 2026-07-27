import { useState, useEffect } from "react";
import BASE_URL from "Base/api";

const DASHBOARD_CATEGORY_ID = 39;

// Maps backend permissionType numbers to widget visibility keys.
// These must match the permission types the backend registers under category 39.
const WIDGET_PERMISSION_MAP = {
  10: "paymentSummary",
  11: "salesSummary",
  12: "shippingTarget",
  13: "activeShifts",
  14: "outstandingCustomers",
  15: "stockBalance",
};

const ALL_WIDGET_KEYS = Object.values(WIDGET_PERMISSION_MAP);

const buildDefaults = (value) =>
  Object.fromEntries(ALL_WIDGET_KEYS.map((key) => [key, value]));

const useDashboardWidgetPermissions = () => {
  const [widgets, setWidgets] = useState(() => buildDefaults(true));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role =
      typeof window !== "undefined" ? localStorage.getItem("role") : null;

    if (!role) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        const response = await fetch(
          `${BASE_URL}/User/GetModuleCategoryPermissions?roleId=${role}&categoryId=${DASHBOARD_CATEGORY_ID}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch");

        const result = await response.json();
        const data = result?.result?.result;

        if (!Array.isArray(data)) throw new Error("Invalid payload");
        if (cancelled) return;

        const grantedTypes = new Set(data.map((item) => item.permissionType));

        // If the backend hasn't added any of the widget permission types yet,
        // keep everything visible so existing behaviour is unchanged.
        const hasAnyWidgetPermission = Object.keys(WIDGET_PERMISSION_MAP).some(
          (typeNum) => grantedTypes.has(Number(typeNum))
        );

        if (!hasAnyWidgetPermission) {
          setWidgets(buildDefaults(true));
        } else {
          const next = {};
          for (const [typeNum, key] of Object.entries(WIDGET_PERMISSION_MAP)) {
            next[key] = grantedTypes.has(Number(typeNum));
          }
          setWidgets(next);
        }
      } catch {
        // On error keep all widgets visible so the dashboard degrades gracefully.
        if (!cancelled) setWidgets(buildDefaults(true));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...widgets, loading };
};

export default useDashboardWidgetPermissions;
