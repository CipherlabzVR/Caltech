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

/** True when currentPath is this menu path or a nested route under it (segment-safe). */
function pathMatchesLeaf(menuPath, currentPath) {
  const np = normalizePath(menuPath || "");
  if (!np) return false;
  return currentPath === np || currentPath.startsWith(`${np}/`);
}

/**
 * Best leaf in subNav for the current route (supports nested subNav).
 * Prefers exact match, then the longest path — so /work-track/technician/
 * maps to Technician (154), not the parent Work Track (153).
 */
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
    if (!pathMatchesLeaf(p, currentPath)) continue;
    const len = normalizePath(p).length;
    if (len > bestLen) {
      best = subItem;
      bestLen = len;
    }
  }
  return best;
}

const SubMenu = ({ item, allItems, onCheckPermission, hoverMode = false }) => {
  const [subnav, setSubnav] = useState(false);
  const [nestedOpen, setNestedOpen] = useState({});
  const [cat, setCat] = useState(null);
  const router = useRouter();
  const role = localStorage.getItem("role");

  const isActive = router.asPath === item.path || router.asPath.startsWith(item.path);

  const showSubnav = () => {
    setSubnav(!subnav);
  };

  // Removed hover functionality for submenu items
  // Hover mode only affects Menu icon in header, not submenu items


  const fetchPermission = async (cId) => {
    try {
      const response = await fetch(`${BASE_URL}/User/GetModuleCategoryNavigationPermissions?roleId=${role}&categoryId=${cId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      if(onCheckPermission){
        onCheckPermission(result.result)
      }

    } catch (err) {
      //
    }
  };

  useEffect(() => {
    const currentPath = normalizePath(router.asPath.split("?")[0].split("#")[0]);

    let bestMenu = null;
    let bestSub = null;
    let bestLen = -1;

    (allItems || []).forEach((menuItem) => {
      const matchedSub = findMatchingLeafInSubNav(menuItem.subNav, currentPath);
      if (!matchedSub) return;
      const len = normalizePath(matchedSub.path || "").length;
      if (len > bestLen) {
        bestLen = len;
        bestMenu = menuItem;
        bestSub = matchedSub;
      }
    });

    if (bestMenu && bestSub) {
      sessionStorage.setItem("moduleid", bestMenu.ModuleId);
      sessionStorage.setItem("category", bestSub.categoryId);
      setCat(bestSub.categoryId);
    }
  }, [router.asPath, allItems]);

  useEffect(() => {
      if (cat) {
        fetchPermission(cat);
      }
    }, [cat]);

  const availableSubNav = useMemo(
    () => item.subNav?.filter((subItem) => subItem.isAvailable) || [],
    [item.subNav]
  );

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
          const np = normalizePath(p);
          return np === currentPath || currentPath.startsWith(np);
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
      // Always prevent default navigation for items with subNav
      e.preventDefault();
      // Toggle submenu on click
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
                    className={styles.sidebarLink}
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
                            className={styles.sidebarLink}
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

