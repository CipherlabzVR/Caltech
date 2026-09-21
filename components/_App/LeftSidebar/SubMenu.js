import React, { useState, useEffect, useMemo } from "react";
import { styled } from "@mui/material/styles";
import styles from "@/components/_App/LeftSidebar/SubMenu.module.css";
import { useRouter } from "next/router";
import Link from "next/link";
import BASE_URL from "Base/api";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";

const SidebarLabel = styled("span")(({ theme }) => ({
  position: "relative",
  top: "-3px",
}));

const normalizePath = (path) => path.replace(/\/+$/, "");

/** True when currentPath is the menu path or a child segment (not a sibling prefix like /grn vs /grn-return). */
function pathMatchesRoute(menuPath, currentPath) {
  const np = normalizePath(menuPath);
  return np === currentPath || currentPath.startsWith(`${np}/`);
}

/** Best (longest path) leaf in subNav matching the current route (supports nested subNav). */
function findMatchingLeafInSubNav(subNav, currentPath) {
  let best = null;
  let bestLen = -1;

  for (const subItem of subNav || []) {
    if (subItem.subNav?.length) {
      const nested = findMatchingLeafInSubNav(subItem.subNav, currentPath);
      if (nested) {
        const nestedLen = normalizePath(nested.path || "").length;
        if (nestedLen > bestLen) {
          best = nested;
          bestLen = nestedLen;
        }
      }
      continue;
    }
    const p = subItem.path;
    if (!p || p === "#") continue;
    const np = normalizePath(p);
    if (pathMatchesRoute(np, currentPath) && np.length > bestLen) {
      best = subItem;
      bestLen = np.length;
    }
  }
  return best;
}

const SubMenu = ({ item, allItems, onCheckPermission, hoverMode = false }) => {
  const [nestedOpen, setNestedOpen] = useState({});
  const [cat, setCat] = useState(null);
  const router = useRouter();
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const availableSubNav = useMemo(
    () => item.subNav?.filter((subItem) => subItem.isAvailable) || [],
    [item.subNav]
  );

  const normalize = (path) => (path || "").replace(/\/+$/, "");
  const currentPath = normalize(router.asPath.split("?")[0].split("#")[0]);

  const pathMatches = (basePath) => {
    const base = normalize(basePath);
    if (!base) return false;
    return currentPath === base || currentPath.startsWith(`${base}/`);
  };

  const hasActiveChild = availableSubNav.some((subItem) => pathMatches(subItem.path));

  // Parent highlight only — same as before (do not restyle submenu rows)
  const isActive = router.asPath === item.path || router.asPath.startsWith(item.path);

  const [subnav, setSubnav] = useState(hasActiveChild);

  // Keep the active module's dropdown open when navigating within it
  useEffect(() => {
    if (hasActiveChild) {
      setSubnav(true);
    }
  }, [hasActiveChild, router.asPath]);

  const showSubnav = () => {
    setSubnav((open) => !open);
  };

  const fetchPermission = async (cId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/User/GetModuleCategoryNavigationPermissions?roleId=${role}&categoryId=${cId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const result = await response.json();
      if (onCheckPermission) {
        onCheckPermission(result.result);
      }
    } catch (err) {
      //
    }
  };

  useEffect(() => {
    const path = normalizePath(router.asPath.split("?")[0].split("#")[0]);

    let bestMatch = null;
    let bestModuleId = null;
    let bestLen = -1;

    allItems.forEach((menuItem) => {
      const matchedSub = findMatchingLeafInSubNav(menuItem.subNav, path);
      if (!matchedSub) return;
      const len = normalizePath(matchedSub.path || "").length;
      if (len > bestLen) {
        bestMatch = matchedSub;
        bestModuleId = menuItem.ModuleId;
        bestLen = len;
      }
    });

    if (bestMatch) {
      sessionStorage.setItem("moduleid", bestModuleId);
      sessionStorage.setItem("category", bestMatch.categoryId);
      setCat(bestMatch.categoryId);
    }
  }, [router.asPath, allItems]);

  useEffect(() => {
    if (cat) {
      fetchPermission(cat);
    }
  }, [cat]);

  useEffect(() => {
    const currentPath = normalizePath(router.asPath.split("?")[0].split("#")[0]);
    setNestedOpen((prev) => {
      const merged = { ...prev };
      let changed = false;
      availableSubNav.forEach((subItem, idx) => {
        if (!subItem.subNav?.length) return;
        const open = subItem.subNav.some((child) => {
          if (!child.isAvailable) return false;
          const p = child.path;
          if (!p || p === "#") return false;
          return pathMatchesRoute(p, currentPath);
        });
        if (open && !merged[idx]) {
          merged[idx] = true;
          changed = true;
        }
      });
      return changed ? merged : prev;
    });
  }, [router.asPath, availableSubNav]);

  if ((item.title.toLowerCase() === "dashboard"||item.title.toLowerCase() === "contact" || item.title.toLowerCase() === "versions"|| item.title.toLowerCase() === "calendar") && availableSubNav.length === 1) {
    const onlySubItem = availableSubNav[0];
    item.path = onlySubItem.path;
    item.subNav = null;
  }

  const handleMainClick = (e) => {
    if (item.subNav) {
      e.preventDefault();
      showSubnav();
      return;
    }

    sessionStorage.setItem("moduleid", item.ModuleId);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <Link
        href={item.subNav ? "#" : item.path || "#"}
        onClick={handleMainClick}
        className={`${styles.sidebarLink} ${isActive ? "sidebarLinkActive" : ""}`}
      >
        <div>
          {item.icon}
          <SidebarLabel className="ml-1">{item.title}</SidebarLabel>
        </div>
        <div>
          {item.subNav && subnav
            ? item.iconOpened
            : item.subNav
              ? item.iconClosed
              : null}
        </div>
      </Link>

      {subnav && (
        <div style={{ position: "relative", width: "100%" }}>
          {availableSubNav.map((subItem, index) => {
            if (subItem.subNav?.length) {
              const nestedOpenFor = nestedOpen[index];
              const ArrowClosed = subItem.iconClosed || <KeyboardArrowRight />;
              const ArrowOpened = subItem.iconOpened || <KeyboardArrowDown />;
              const nestedLeaves = subItem.subNav.filter((c) => c.isAvailable);
              return (
                <div key={index} className={styles.subMenu}>
                  <Link
                    href="#"
                    className={`${styles.sidebarLink} ${styles.nestedGroup}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setNestedOpen((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }));
                    }}
                  >
                    <div>
                      {subItem.icon}
                      <SidebarLabel className="ml-1">{subItem.title}</SidebarLabel>
                    </div>
                    <div>{nestedOpenFor ? ArrowOpened : ArrowClosed}</div>
                  </Link>
                  {nestedOpenFor && (
                    <div style={{ position: "relative", width: "100%" }}>
                      {nestedLeaves.map((child, cidx) => (
                        <div key={`${index}-${cidx}`} className={styles.subMenu}>
                          <Link
                            href={child.path}
                            className={`${styles.sidebarLink} ${styles.nestedItem}`}
                            onClick={() => {
                              sessionStorage.setItem("moduleid", item.ModuleId);
                              sessionStorage.setItem("category", child.categoryId);
                            }}
                          >
                            <div>
                              {child.icon}
                              <SidebarLabel className="ml-1">
                                {child.title} {child.categoryId === 60 ? "(POS)" : ""}
                              </SidebarLabel>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={index} className={styles.subMenu}>
                <Link
                  href={subItem.path}
                  className={styles.sidebarLink}
                  onClick={() => {
                    sessionStorage.setItem("moduleid", item.ModuleId);
                    sessionStorage.setItem("category", subItem.categoryId);
                  }}
                >
                  <div>
                    {subItem.icon}
                    <SidebarLabel className="ml-1">
                      {subItem.title} {subItem.categoryId === 60 ? "(POS)" : ""}
                    </SidebarLabel>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubMenu;
