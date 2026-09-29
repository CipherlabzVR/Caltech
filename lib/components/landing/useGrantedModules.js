import { useEffect, useState } from "react";
import { getSidebarData } from "@/components/_App/LeftSidebar/SidebarData";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import BASE_URL from "Base/api";

const SERVICE_MODULE_ID = 28;
const SERVICE_MODULE_CATEGORY_IDS = [196, 197, 198, 200, 201];

const MODULE_DESCRIPTIONS = {
  Dashboard: "Monitor business metrics and live dashboards",
  Calendar: "View schedules and appointments",
  "Master Data": "Maintain core business records",
  PMO: "Projects, tasks, timeline, and reports",
  Finance: "Accounts, payments, and financial reports",
  HR: "Employees, payroll, and leave management",
  ECommerce: "Online orders, promotions, and storefront",
  Apparel: "Quotations, production, and garment workflow",
  Inventory: "Stock, GRN, purchases, and transfers",
  Assets: "Asset register, categories, and locations",
  Sales: "Invoices, receipts, and sales documents",
  "Restaurant POS": "Point of sale and dining operations",
  Production: "Manufacturing and production tracking",
  Contact: "CRM contacts and communications",
  Reservation: "Bookings and appointment management",
  Approval: "Review and approve pending requests",
  Payments: "Customer and supplier payments",
  Reports: "Operational and financial reports",
  CRM: "Leads, accounts, and customer relationships",
  "Help Desk": "Support tickets and service requests",
  "Service Management": "Service jobs and device tracking",
  Subscription: "Plans and subscription billing",
  "Work Track": "Field work and technician tracking",
  Matrimonial: "Profiles, packages, and matchmaking",
  Travel: "Packages, hotels, and travel inquiries",
  Photography: "Reservations, quotations, and studio tasks",
  WhatsApp: "Messaging integration and templates",
  Administrator: "Users, roles, and system settings",
};

function applyPermissionsToSubNav(subNav, moduleId, transformed, isHelpDeskSupport) {
  if (!subNav?.length) return subNav;
  return subNav.map((sub) => {
    if (sub.subNav?.length) {
      const nested = applyPermissionsToSubNav(
        sub.subNav,
        moduleId,
        transformed,
        isHelpDeskSupport
      );
      return {
        ...sub,
        subNav: nested,
        isAvailable: nested.some((n) => n.isAvailable),
      };
    }
    if (sub.userTypeRestriction) {
      if (!isHelpDeskSupport) {
        return { ...sub, isAvailable: false };
      }
      const matched = transformed.find(
        (t) => t.ModuleId === moduleId && t.CategoryId === sub.categoryId
      );
      return {
        ...sub,
        isAvailable: matched ? matched.IsAvailable : false,
      };
    }
    const matched = transformed.find(
      (t) => t.ModuleId === moduleId && t.CategoryId === sub.categoryId
    );
    return {
      ...sub,
      isAvailable: matched ? matched.IsAvailable : false,
    };
  });
}

function filterAvailableSubNav(subNav) {
  if (!subNav?.length) return [];
  return subNav
    .map((sub) => {
      if (sub.subNav?.length) {
        return { ...sub, subNav: filterAvailableSubNav(sub.subNav) };
      }
      return sub;
    })
    .filter((sub) => {
      if (sub.subNav?.length) {
        return sub.subNav.length > 0;
      }
      return sub.isAvailable;
    });
}

function resolveSubNavAvailability(sub, menuModuleId, transformed) {
  if (sub.userTypeRestriction) {
    const userType = localStorage.getItem("type");
    const isHelpDeskSupport = userType === "14" || userType === 14;
    if (!isHelpDeskSupport) {
      return { ...sub, isAvailable: false };
    }
  }

  if (sub.serviceModuleAccess) {
    const matched = transformed.find(
      (t) =>
        t.ModuleId === SERVICE_MODULE_ID &&
        SERVICE_MODULE_CATEGORY_IDS.includes(t.CategoryId) &&
        t.IsAvailable
    );
    return {
      ...sub,
      isAvailable: !!matched,
      categoryId: matched?.CategoryId ?? sub.categoryId,
    };
  }

  const matched = transformed.find(
    (t) => t.ModuleId === menuModuleId && t.CategoryId === sub.categoryId
  );
  return {
    ...sub,
    isAvailable: matched ? matched.IsAvailable : false,
  };
}

function firstAvailablePath(subNav) {
  if (!subNav?.length) return null;
  for (const sub of subNav) {
    if (sub.subNav?.length) {
      const nested = firstAvailablePath(sub.subNav);
      if (nested) return nested;
    } else if (sub.isAvailable !== false && sub.path) {
      return sub.path;
    }
  }
  return null;
}

/**
 * Returns sidebar modules the current user can navigate into.
 * Same permission rules as LeftSidebar.
 */
export default function useGrantedModules() {
  const { data: isGarmentSystem } = IsAppSettingEnabled("IsGarmentSystem");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const load = async () => {
      setLoading(true);
      try {
        const role = localStorage.getItem("role");
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("type");
        const isHelpDeskSupport = userType === "14" || userType === 14;
        const rawItems = getSidebarData(isGarmentSystem);

        let transformed = [];

        if (role && token) {
          const response = await fetch(
            `${BASE_URL}/User/GetRolePermissionByRolePermissionTypeId?roleId=${role}&permissionTypeId=1`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            transformed = (data.result || []).map((item) => {
              const navPermission = (item.permissionTypes || []).find(
                (p) => p.name === "Navigation"
              );
              return {
                ModuleId: item.moduleId,
                CategoryId: item.id,
                IsAvailable: navPermission ? navPermission.isActive : false,
              };
            });
          }
        }

        const granted = rawItems
          .map((menu) => {
            const updated = { ...menu };
            if (updated.subNav) {
              updated.subNav = applyPermissionsToSubNav(
                updated.subNav,
                updated.ModuleId,
                transformed,
                isHelpDeskSupport
              );
              updated.subNav = updated.subNav.map((sub) =>
                resolveSubNavAvailability(sub, updated.ModuleId, transformed)
              );
              updated.subNav = filterAvailableSubNav(updated.subNav);
            }
            const href =
              firstAvailablePath(updated.subNav) || updated.path || "/";
            return {
              title: updated.title,
              path: updated.path,
              href,
              icon: updated.icon,
              ModuleId: updated.ModuleId,
              description:
                MODULE_DESCRIPTIONS[updated.title] ||
                `Open ${updated.title} module`,
              IsAvailable: (updated.subNav || []).length > 0,
              subNav: updated.subNav || [],
            };
          })
          .filter((menu) => menu.IsAvailable);

        setModules(granted);
      } catch (error) {
        console.error("Failed to load granted modules:", error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isGarmentSystem]);

  return { modules, loading };
}
