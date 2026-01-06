import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, ButtonBase, Fade } from "@mui/material";
import Link from "next/link";
import { getSidebarData } from "@/components/_App/LeftSidebar/SidebarData";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import BASE_URL from "Base/api";
import { ProjectNo } from "Base/catelogue";
import categoryIcons from "@/components/shared/categoryIcons";

const fallbackDescriptions = {
  Dashboard: "Monitor metrics",
  Finance: "Manage finances",
  "Master Data": "Maintain records",
  ECommerce: "Handle online orders",
  Apparel: "Track production",
  Inventory: "Control stock",
  Sales: "Process sales",
  "Restaurant POS": "POS overview",
  Production: "Plan production",
  Contact: "Manage contacts",
  Reservation: "Schedule bookings",
  Approval: "Review approvals",
  Payments: "Track payments",
  Reports: "View reports",
  CRM: "Manage relationships",
  "Help Desk": "Support tickets",
  Administrator: "Admin settings",
  Calendar: "View calendar",
  Default: "Quick entry",
};

const formatModules = (modules) =>
  (modules || [])
    .filter((module) => module)
    .map((module) => {
      const entries = (module.subNav || [])
        .filter((sub) => sub)
        .map((sub) => ({
          ...sub,
          isAvailable: sub.isAvailable !== false,
          description:
            sub.description ||
            fallbackDescriptions[sub.title] ||
            fallbackDescriptions[module.title] ||
            fallbackDescriptions.Default,
        }));

      const enabledEntries = entries.filter((entry) => entry.isAvailable);
      const disabledEntries = entries.filter((entry) => !entry.isAvailable);

      return {
        ...module,
        iconName: module.iconName || module.title,
        hasEnabled: enabledEntries.length > 0,
        subNav: [...enabledEntries, ...disabledEntries],
      };
    })
    .filter((module) => module.subNav && module.subNav.length > 0);

const brandGradient = "linear-gradient(135deg, #023167 0%, #d2202e 100%)";

const getInitials = (title = "") =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const QuickAccessContent = ({ header = null }) => {
  const { data: isGarmentSystem } = IsAppSettingEnabled("IsGarmentSystem");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState(null);
  const [companyLogo, setCompanyLogo] = useState("");
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouse = localStorage.getItem("warehouse");
    const token = localStorage.getItem("token");

    if (!warehouse || !token) {
      return;
    }

    const fetchCompanyImage = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setCompanyLogo(data.logoUrl || "");
      } catch (error) {
        // ignore logo fetch errors
      }
    };

    fetchCompanyImage();
  }, []);

  const applyModules = (source) => {
    const formatted = formatModules(source);
    const sorted = [...formatted].sort((a, b) => {
      if (a.hasEnabled === b.hasEnabled) {
        return a.title.localeCompare(b.title);
      }
      return a.hasEnabled ? -1 : 1;
    });

    setModules(sorted);
    setShowGrid(true);
    setSelectedModuleTitle((prev) => {
      if (prev && sorted.some((module) => module.title === prev)) {
        return prev;
      }
      const firstEnabled = sorted.find((module) => module.hasEnabled);
      return firstEnabled ? firstEnabled.title : null;
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadModules = async () => {
      setLoading(true);
      try {
        const rawItems = getSidebarData(isGarmentSystem);
        const role = localStorage.getItem("role");
        const userType = localStorage.getItem("type");
        const isHelpDeskSupport = userType === "14" || userType === 14;

        if (!role) {
          // Filter by user type even when no role
          const filteredItems = rawItems.map((module) => {
            if (!module.subNav) {
              return module;
            }
            const filteredSubNav = module.subNav.filter((sub) => {
              // Hide items with userTypeRestriction if user doesn't match
              if (sub.userTypeRestriction && !isHelpDeskSupport) {
                return false;
              }
              return true;
            });
            return {
              ...module,
              subNav: filteredSubNav,
              IsAvailable: filteredSubNav.length > 0,
            };
          }).filter((module) => module.IsAvailable);
          applyModules(filteredItems);
          setLoading(false);
          return;
        }

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

        if (response.ok) {
          const result = await response.json();
          const permissions =
            result?.result?.map((item) => {
              const navigationPermission = item.permissionTypes?.find(
                (permission) => permission.name === "Navigation"
              );
              return {
                categoryId: item.id,
                isAvailable: navigationPermission
                  ? navigationPermission.isActive
                  : false,
              };
            }) || [];

          const userType = localStorage.getItem("type");
          const isHelpDeskSupport = userType === "14" || userType === 14;

          const updated = rawItems.map((module) => {
            if (!module.subNav) {
              return module;
            }

            const updatedSubNav = module.subNav.map((sub) => {
              // Check user type restriction (e.g., only HelpDeskSupport can see self dashboard)
              if (sub.userTypeRestriction && !isHelpDeskSupport) {
                return {
                  ...sub,
                  isAvailable: false,
                };
              }
              const match = permissions.find(
                (permission) => permission.categoryId === sub.categoryId
              );
              if (match) {
                return { ...sub, isAvailable: match.isAvailable };
              }
              return { ...sub, isAvailable: false };
            });

            return {
              ...module,
              subNav: updatedSubNav,
              IsAvailable: updatedSubNav.length > 0,
            };
          });

          applyModules(updated);
        } else {
          applyModules(rawItems);
        }
      } catch (error) {
        const fallback = getSidebarData(isGarmentSystem);
        applyModules(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [isGarmentSystem]);

  const defaultLogo = ProjectNo === 1 ? "/images/cbass.png" : "/images/db-logo.png";
  const logoSrc = companyLogo || defaultLogo;
  const activeModule = modules.find(
    (module) => module.title === selectedModuleTitle
  );

  return (
    <>
      {logoSrc && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Box
            component="img"
            src={logoSrc}
            alt="Company Logo"
            sx={{ height: 100, maxWidth: 300, objectFit: "contain" }}
          />
        </Box>
      )}
      {header}
      <Box mt={5} sx={{ display: "flex", flexDirection: "column", gap: 3, minHeight: "80vh", px: { xs: 1, sm: 2 }, pb: 4 }}>
        {loading ? (
          <Box
            sx={{
              width: "100%",
              minHeight: "220px",
              borderRadius: "12px",
              border: "none",
              boxShadow: "none",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: "#7d8fb3", fontWeight: 500 }}
            >
              Loading quick access modules...
            </Typography>
          </Box>
        ) : modules.length > 0 ? (
          <>
            {showGrid ? (
              <Fade in={showGrid} timeout={300} unmountOnExit>
                <Grid
                  container
                  spacing={1}
                  justifyContent="center"
                  sx={{ mb: 2, maxWidth: 900, mx: "auto" }}
                >
                  {modules.map((module, index) => {
                    const selected = module.title === selectedModuleTitle;
                    const disabledModule = !module.hasEnabled;
                    const IconComponent =
                      categoryIcons[module.iconName || module.title] ||
                      categoryIcons[module.title];

                    return (
                      <Grid item xs={4} sm={4} md={2} lg={2} key={module.title}>
                        <ButtonBase
                          onClick={() => {
                            if (disabledModule) {
                              return;
                            }
                            setSelectedModuleTitle(module.title);
                            setShowGrid(false);
                          }}
                          disabled={disabledModule}
                          sx={{
                            width: "100%",
                            borderRadius: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.6,
                            py: 0.85,
                            transition: "transform 0.2s ease",
                            transform:
                              selected && !disabledModule
                                ? "translateY(-4px)"
                                : "none",
                            opacity: disabledModule ? 0.4 : 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: "22px",
                              background: disabledModule
                                ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5f5 100%)"
                                : brandGradient,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "24px",
                              fontWeight: 700,
                              boxShadow: disabledModule
                                ? "none"
                                : selected
                                ? "0px 18px 30px rgba(2, 49, 103, 0.35)"
                                : "0px 12px 24px rgba(2, 49, 103, 0.22)",
                              border: disabledModule
                                ? "2px solid rgba(226, 232, 240, 0.8)"
                                : selected
                                ? "2px solid rgba(255, 255, 255, 0.6)"
                                : "2px solid rgba(2, 49, 103, 0.2)",
                            }}
                          >
                            {IconComponent ? (
                              <IconComponent sx={{ fontSize: 30 }} />
                            ) : (
                              getInitials(module.title)
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: selected ? 700 : 600,
                              letterSpacing: "0.3px",
                              color: disabledModule
                                ? "#94a3b8"
                                : selected
                                ? "#0b1a36"
                                : "#1f2b4d",
                              textAlign: "center",
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                            }}
                          >
                            {module.title}
                          </Typography>
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
              </Fade>
            ) : null}

            {!showGrid && activeModule ? (
              activeModule.hasEnabled ? (
                <Fade in={!showGrid} timeout={300} unmountOnExit>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          maxWidth: 900,
                          mb: 3,
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                          <Box
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: "22px",
                              background: brandGradient,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "24px",
                              fontWeight: 700,
                              boxShadow: "0px 18px 30px rgba(2, 49, 103, 0.28)",
                            }}
                          >
                            {categoryIcons[activeModule.iconName || activeModule.title] ? (
                              React.createElement(
                                categoryIcons[
                                  activeModule.iconName || activeModule.title
                                ],
                                { sx: { fontSize: 32 } }
                              )
                            ) : (
                              getInitials(activeModule.title)
                            )}
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, color: "#0f172a" }}
                            >
                              {activeModule.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#64748b" }}
                            >
                              Categories
                            </Typography>
                          </Box>
                        </Box>

                        <ButtonBase
                          onClick={() => setShowGrid(true)}
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: "999px",
                            color: "#475569",
                            border: "1px solid rgba(148, 163, 184, 0.5)",
                            backgroundColor: "rgba(248, 250, 252, 0.8)",
                            fontSize: "14px",
                            fontWeight: 600,
                            ml: { xs: 0, sm: "auto" },
                          }}
                        >
                          ← Go Back
                        </ButtonBase>
                      </Box>
                    </Box>

                    {activeModule.subNav && activeModule.subNav.length > 0 ? (
                      <Grid
                        container
                        spacing={1}
                        justifyContent="center"
                        sx={{ maxWidth: 900, mx: "auto" }}
                      >
                        {activeModule.subNav.map((item, index) => {
                          const initials = getInitials(item.title);
                          const disabled = item.isAvailable === false;

                          return (
                            <Grid
                              item
                              xs={6}
                              sm={4}
                              md={2}
                              lg={2}
                              key={item.path || `${item.title}-${index}`}
                            >
                              <ButtonBase
                                component={disabled ? "div" : Link}
                                href={disabled ? undefined : item.path}
                                disabled={disabled}
                                sx={{
                                  width: "100%",
                                  borderRadius: "24px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 0.6,
                                  py: 0.85,
                                  opacity: disabled ? 0.45 : 1,
                                  cursor: disabled ? "not-allowed" : "pointer",
                                  transition: "transform 0.2s ease",
                                  transform: disabled ? "none" : "translateY(0)",
                                  "&:hover": disabled
                                    ? {}
                                    : {
                                        transform: "translateY(-4px)",
                                      },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: "22px",
                                    background: disabled
                                      ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5f5 100%)"
                                      : brandGradient,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: "24px",
                                    fontWeight: 700,
                                    boxShadow: disabled
                                      ? "none"
                                      : "0px 18px 30px rgba(2, 49, 103, 0.35)",
                                    border: disabled
                                      ? "2px solid rgba(226, 232, 240, 0.8)"
                                      : "2px solid rgba(2, 49, 103, 0.2)",
                                  }}
                                >
                                  {initials}
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    letterSpacing: "0.3px",
                                    color: disabled ? "#94a3b8" : "#0b1a36",
                                    textAlign: "center",
                                    textTransform: "uppercase",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {item.title}
                                </Typography>
                              </ButtonBase>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : null}
                  </Box>
                </Fade>
              ) : null
            ) : null}
          </>
        ) : (
          <Box
            sx={{
              borderRadius: "12px",
              border: "1px dashed rgba(148, 163, 184, 0.4)",
              backgroundColor: "rgba(241, 245, 249, 0.6)",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 500 }}>
              No quick access items available.
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default QuickAccessContent;

