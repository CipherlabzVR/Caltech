import * as React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import Email from "./Email";
import Notification from "./Notification";
import Profile from "./Profile";
import Tooltip from "@mui/material/Tooltip";
import CurrentDate from "./CurrentDate";
import Link from "next/link";
import BASE_URL from "Base/api";
import { ProjectNo } from "Base/catelogue";
import GridViewIcon from "@mui/icons-material/GridView";
import SettingsIcon from "@mui/icons-material/Settings";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { useRouter } from "next/router";
import styles from "./TopNavbar.module.css";
import { TopbarContext } from "../TopbarContext";

const TopNavbar = ({
  showSidebar,
  hideSidebar,
  sidebarHidden = false,
  onActiveChange,
}) => {
  const [companyLogo, setCompanyLogo] = React.useState("");
  const router = useRouter();
  const { activeButton: contextActiveButton, setActiveButton, hoverMode = false, setHoverMode } =
    React.useContext(TopbarContext);
  const [activeButton, setActiveButtonState] = React.useState(
    contextActiveButton || "quick-access"
  );

  React.useEffect(() => {
    setActiveButtonState(contextActiveButton || "quick-access");
  }, [contextActiveButton]);

  React.useEffect(() => {
    onActiveChange?.(activeButton);
    setActiveButton?.(activeButton);
  }, [activeButton, onActiveChange, setActiveButton]);

  React.useEffect(() => {
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
          throw new Error("Failed to fetch company logo");
        }

        const data = await response.json();
        setCompanyLogo(data.logoUrl || "");
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompanyImage();
  }, []);

  const defaultLogo =
    ProjectNo === 1 ? "/images/cbass.png" : "/images/db-logo.png";
  const logoSrc = companyLogo || defaultLogo;
  const homeHref = ProjectNo === 2 ? "/dashboard/reservation" : "/";

  return (
    <>
      <div className="topNavbarDark">
        <AppBar
          color="inherit"
          sx={{
            backgroundColor: "#fff",
            boxShadow: "0px 4px 20px rgba(47, 143, 232, 0.07)",
            py: "6px",
            mb: "30px",
            position: "sticky",
          }}
          className="top-navbar-for-dark"
        >
          <Toolbar>
            <Tooltip title="Quick Access" arrow>
              <IconButton
                size="sm"
                edge="start"
                color="inherit"
                sx={{ mr: 0.5, width: 40, height: 40 }}
                className={`${styles.actionButton} ${
                  activeButton === "quick-access" ? styles.activeButton : ""
                }`}
                onClick={() => {
                  setActiveButtonState("quick-access");
                  if (hideSidebar) {
                    hideSidebar();
                  }
                  router.push("/quick-access");
                }}
              >
                <GridViewIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Menu" arrow>
              <IconButton
                size="sm"
                edge="start"
                color="inherit"
                className={`${styles.actionButton} ${
                  activeButton === "menu" ? styles.activeButton : ""
                }`}
                onClick={() => {
                  setActiveButtonState("menu");
                  if (showSidebar) {
                    showSidebar();
                  }
                  if (router.pathname !== "/") {
                    router.push("/");
                  }
                }}
                onMouseEnter={() => {
                  // When hover mode is ON, open sidebar on hover
                  if (hoverMode && showSidebar) {
                    setActiveButtonState("menu");
                    showSidebar();
                    if (router.pathname !== "/") {
                      router.push("/");
                    }
                  }
                }}
                sx={{ ml: 0.5, width: 40, height: 40 }}
              >
                <i className="ri-align-left"></i>
              </IconButton>
            </Tooltip>

            <Tooltip title={hoverMode ? "Hover Mode: ON" : "Hover Mode: OFF"} arrow>
              <IconButton
                size="sm"
                edge="start"
                color="inherit"
                className={styles.actionButton}
                onClick={() => {
                  if (setHoverMode) {
                    setHoverMode(!hoverMode);
                  }
                }}
                sx={{ ml: 0.5, width: 40, height: 40 }}
              >
                {hoverMode ? (
                  <ToggleOnIcon sx={{ color: "#757FEF", fontSize: 28 }} />
                ) : (
                  <ToggleOffIcon sx={{ color: "#818093", fontSize: 28 }} />
                )}
              </IconButton>
            </Tooltip>

            {sidebarHidden && (
              <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                <Link
                  href={homeHref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    maxHeight: 36,
                  }}
                >
                  <Box
                    component="img"
                    src={logoSrc}
                    alt="Company Logo"
                    sx={{
                      height: 32,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                </Link>
              </Box>
            )}

            {/* Search form */}
            {/* <SearchForm /> */}

            <Typography component="div" sx={{ flexGrow: 1 }}></Typography>

            <Stack direction="row" spacing={2}>

              {/* CurrentDate */}
              <CurrentDate />

              {/* Settings */}
              <Tooltip title="Settings" arrow>
                <IconButton
                  size="small"
                  edge="end"
                  color="inherit"
                  sx={{ width: 40, height: 40 }}
                  className={styles.actionButton}
                  onClick={() => {
                    const event = new CustomEvent('openControlPanel');
                    window.dispatchEvent(event);
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              {/* Notification */}
              <Email />

              {/* Notification */}
              <Notification />

              {/* Profile */}
              <Profile />
            </Stack>
          </Toolbar>
        </AppBar>
      </div>
    </>
  );
};

export default TopNavbar;
