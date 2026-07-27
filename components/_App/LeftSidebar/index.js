import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { getSidebarData, SidebarData } from "./SidebarData";
import SubMenu from "./SubMenu";
import Link from "next/link";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import BASE_URL from "Base/api";
import { ProjectNo } from "Base/catelogue";

/** Apply role permissions to sidebar subNav; supports one level of nested subNav (e.g. Master Data → HR). */
function applyPermissionsToSubNav(subNav, moduleId, transformed, isHelpDeskSupport) {
  if (!subNav?.length) return subNav;
  return subNav.map((sub) => {
    if (sub.subNav?.length) {
      const nested = applyPermissionsToSubNav(sub.subNav, moduleId, transformed, isHelpDeskSupport);
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

/** Keep only items the user may see; nested parents remain if any child is visible. */
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

const SERVICE_MODULE_ID = 28;
const SERVICE_MODULE_CATEGORY_IDS = [196, 197, 198, 200, 201];

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

const SidebarNav = styled("nav")(({ theme }) => ({
  background: "#fff",
  boxShadow: "0px 4px 20px rgba(47, 143, 232, 0.07)",
  width: "300px",
  padding: "0 10px",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  position: "fixed",
  top: 0,
  left: 0,
  transition: "350ms",
  zIndex: "10",
  overflowY: "auto",
}));

const SidebarWrap = styled("div")(({ theme }) => ({
  width: "100%",
}));

const Sidebar = ({ toogleActive, onGrantedCheck, hoverMode = false }) => {
  const { data: IsGarmentSystem } = IsAppSettingEnabled("IsGarmentSystem");
  const [sidebarItems, setSidebarItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const role = localStorage.getItem("role");
  const [companyLogo, setCompanyLogo] = useState("");
  const [permission, setPermission] = useState(true);
  const availableItems = sidebarItems.filter((item) => item.IsAvailable);
  const leaveTimeoutRef = useRef(null);

  const warehouse = localStorage.getItem("warehouse");

  const handleSetPermission = (bool) => {
    setPermission(bool);
  }

  const fetchCompanyImage = async () => {
    try {
      if (!warehouse) {
        return;
      }

      const response = await fetch(
        `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch company logo");
      }

      const data = await response.json();
      setCompanyLogo(data.logoUrl || "");
    } catch (error) {
      console.error("Error fetching company logo:", error);
      // Keep default logo on error
      setCompanyLogo("");
    }
  };

  const fetchModulePermissions = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/User/GetRolePermissionByRolePermissionTypeId?roleId=${role}&permissionTypeId=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }

      const data = await response.json();
      const transformed = data.result.map((item) => {
        const navPermission = item.permissionTypes.find(
          (p) => p.name === "Navigation"
        );
        return {
          ModuleId: item.moduleId,
          CategoryId: item.id,
          IsAvailable: navPermission ? navPermission.isActive : false,
        };
      });
      const userType = localStorage.getItem("type");
      const isHelpDeskSupport = userType === "14" || userType === 14;

      const rawItems = getSidebarData(IsGarmentSystem);

      const updatedItems = rawItems.map((menu) => {
        const updatedMenu = { ...menu };

        if (updatedMenu.subNav) {
          updatedMenu.subNav = applyPermissionsToSubNav(
            updatedMenu.subNav,
            updatedMenu.ModuleId,
            transformed,
            isHelpDeskSupport
          );
          updatedMenu.subNav = updatedMenu.subNav.map((sub) =>
            resolveSubNavAvailability(sub, updatedMenu.ModuleId, transformed)
          );
        }

        return updatedMenu;
      });

      setAllItems(updatedItems);

      const filteredMenus = updatedItems
        .map((menu) => {
          if (menu.subNav) {
            const filteredSubNav = filterAvailableSubNav(menu.subNav);
            return {
              ...menu,
              subNav: filteredSubNav,
              IsAvailable: filteredSubNav.length > 0,
            };
          }
          return {
            ...menu,
            IsAvailable: true,
          };
        })
        .filter((menu) => menu.IsAvailable);
      setSidebarItems(filteredMenus);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  useEffect(() => {
    fetchModulePermissions();
    if (warehouse) {
      fetchCompanyImage();
    }
  }, [warehouse]);

  useEffect(() => {
    if (onGrantedCheck) {
      onGrantedCheck(permission);
    }
  }, [permission]);

  const handleMouseLeave = () => {
    // When hover mode is ON and mouse leaves sidebar, close it
    if (hoverMode && toogleActive) {
      // Add a small delay to prevent accidental closing
      leaveTimeoutRef.current = setTimeout(() => {
        toogleActive();
      }, 200);
    }
  };

  const handleMouseEnter = () => {
    // Clear any pending close timeout when mouse enters sidebar
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className="leftSidebarDark"
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <SidebarNav className="LeftSidebarNav">
          <SidebarWrap>
            <Box
              sx={{
                px: "10px",
                display: "flex",
                alignItems: "center",
                height: "100px",
                justifyContent: "space-between",
              }}
            >
              <Link
                href={ProjectNo === 2 ? "/dashboard/reservation" : "/"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                {ProjectNo === 1 ? (
                  <>
                    <img
                      src={companyLogo !== "" ? companyLogo : "/images/cbass.png"}
                      alt="Logo"
                      className="black-logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "180px",
                        objectFit: "contain",
                      }}
                    />
                    <img
                      src={companyLogo !== "" ? companyLogo : "/images/cbass.png"}
                      alt="Logo"
                      className="white-logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "180px",
                        objectFit: "contain",
                        display: "none",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <img
                      src="/images/db-logo.png"
                      alt="Logo"
                      className="black-logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "180px",
                        objectFit: "contain",
                      }}
                    />
                    <img
                      src="/images/db-logo.png"
                      alt="Logo"
                      className="white-logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "180px",
                        objectFit: "contain",
                        display: "none",
                      }}
                    />
                  </>
                )}
              </Link>

              {/* Mobile Close Button */}
              <IconButton
                onClick={toogleActive}
                size="small"
                sx={{
                  background: "rgb(253, 237, 237)",
                  display: { lg: "none" },
                }}
              >
                <ClearIcon />
              </IconButton>

              {/* Desktop Close Button */}
              <IconButton
                onClick={toogleActive}
                size="small"
                sx={{
                  background: "rgb(253, 237, 237)",
                  display: { xs: "none", lg: "flex" },
                  "&:hover": {
                    background: "rgb(250, 220, 220)",
                  },
                }}
                aria-label="Close sidebar"
              >
                <ClearIcon />
              </IconButton>
            </Box>


            {availableItems.map((item, index) => (
              <SubMenu item={item} allItems={allItems} key={index} onCheckPermission={handleSetPermission} hoverMode={hoverMode} />
            ))}
          </SidebarWrap>
        </SidebarNav>
      </div>
    </>
  );
};

export default Sidebar;
