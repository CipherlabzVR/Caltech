import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import LeftSidebar from "@/components/_App/LeftSidebar";
import TopNavbar from "@/components/_App/TopNavbar";
import Footer from "@/components/_App/Footer";
import ScrollToTop from "./ScrollToTop";
import ControlPanelModal from "./ControlPanelModal";
import HidableButtons from "../Dashboard/eCommerce/HidableButtons";
import AccessDenied from "../UIElements/Permission/AccessDenied";
import { TopbarContext } from "./TopbarContext";
import { CurrencyProvider } from "@/components/HR/CurrencyContext";
import SnowEffect from "./SnowEffect";
import NewYearEffect from "./NewYearEffect";
import HolidayGreeting from "./HolidayGreeting";
import BASE_URL from "Base/api";

const Layout = ({ children }) => {
  const router = useRouter();
  const [isGranted, setIsGranted] = useState(true);

  const [active, setActive] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [activeTopbarButton, setActiveTopbarButton] = useState("quick-access");

  const showSidebar = useCallback(() => {
    // In desktop: active = false shows sidebar (no active class = visible)
    // In mobile: active = true shows sidebar (active class = visible)
    // Check if we're in mobile view
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      setActive(true); // Mobile: active = true shows sidebar
    } else {
      setActive(false); // Desktop: active = false shows sidebar
    }
  }, []);

  const hideSidebar = useCallback(() => {
    // In desktop: active = true hides sidebar (active class = hidden)
    // In mobile: active = false hides sidebar (no active class = hidden)
    // Check if we're in mobile view
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      setActive(false); // Mobile: active = false hides sidebar
    } else {
      setActive(true); // Desktop: active = true hides sidebar
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      hideSidebar();
      setActiveTopbarButton("quick-access");
      if (router.pathname === "/") {
        router.replace("/quick-access");
      }
      return;
    }

    const fetchLandingPagePreference = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetLoggedUserLandingPage`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          hideSidebar();
          setActiveTopbarButton("quick-access");
          if (router.pathname === "/") {
            router.replace("/quick-access");
          }
          return;
        }

        const data = await response.json();
        const landingPageValue = data?.result?.result?.landingPage ?? null;

        if (landingPageValue === 2) {
          hideSidebar();
          setActiveTopbarButton("quick-access");
          if (router.pathname === "/" || router.pathname === "/quick-access") {
            router.replace("/quick-access");
          }
        } else {
          // Only auto-show sidebar on desktop, not mobile
          if (typeof window !== "undefined" && window.innerWidth >= 1200) {
            showSidebar();
          } else {
            // In mobile, keep sidebar hidden initially
            hideSidebar();
          }
          setActiveTopbarButton("menu");
          if (router.pathname === "/quick-access") {
            router.replace("/");
          }
        }
      } catch (error) {
        hideSidebar();
        setActiveTopbarButton("quick-access");
        if (router.pathname === "/") {
          router.replace("/quick-access");
        }
      }
    };

    fetchLandingPagePreference();
  }, [hideSidebar, showSidebar]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const evaluateSidebarVisibility = () => {
      const viewportWidth = window.innerWidth;

      if (viewportWidth < 1200) {
        setIsSidebarHidden(!active);
        // In mobile view, if sidebar is showing (active = true), ensure it can be closed
        // CSS: .main-wrapper-content.active .LeftSidebarNav { left: 0; } shows sidebar
        // So active = true shows sidebar, active = false hides it
        // We want sidebar to start hidden in mobile, so if we're in mobile and active is true, hide it
        if (active && viewportWidth < 1200) {
          // Sidebar is showing in mobile, but we want it hidden by default
          // Don't auto-hide here, let user control it via menu button
        }
      } else {
        setIsSidebarHidden(active);
      }
    };

    evaluateSidebarVisibility();

    window.addEventListener("resize", evaluateSidebarVisibility);

    return () => {
      window.removeEventListener("resize", evaluateSidebarVisibility);
    };
  }, [active]);

  // Fix: In mobile view, ensure sidebar starts hidden on initial load
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const viewportWidth = window.innerWidth;
    if (viewportWidth < 1200) {
      // In mobile view, sidebar should start hidden
      // CSS shows: .main-wrapper-content.active .LeftSidebarNav { left: 0; } in mobile
      // So active = true shows sidebar, active = false hides it
      // Initial state is active = true, which would show sidebar in mobile
      // We need to hide it initially in mobile view
      setActive(false);
    }
  }, []);

  const handleCheckGranted = (bool) => {
    setIsGranted(bool);
  };

  const noWrapperRoutes = ["/restaurant/dashboard"];

  const isWrapperRequired = !noWrapperRoutes.includes(router.pathname);

  return (
    <CurrencyProvider>
      <TopbarContext.Provider value={{ activeButton: activeTopbarButton, setActiveButton: setActiveTopbarButton }}>
      <>
        <Head>
          <title>CBASS-AI</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        </Head>

        <div
          className={`${isWrapperRequired ? "main-wrapper-content" : ""} ${
            active ? "active" : ""
          }`}
        >
          {!(
            router.pathname === "/authentication/sign-in" ||
            router.pathname === "/authentication/sign-up" ||
            router.pathname === "/authentication/forgot-password" ||
            router.pathname === "/authentication/lock-screen" ||
            router.pathname === "/authentication/confirm-mail" ||
            router.pathname === "/authentication/logout" ||
            router.pathname === "/restaurant/dashboard"
          ) && (
            <>
              <TopNavbar
                showSidebar={showSidebar}
                hideSidebar={hideSidebar}
                sidebarHidden={isSidebarHidden}
                onActiveChange={setActiveTopbarButton}
              />

              <LeftSidebar toogleActive={hideSidebar} onGrantedCheck={handleCheckGranted} />
            </>
          )}

          <div className="main-content">
            {!isGranted ? <AccessDenied /> : children}

            {!(
              router.pathname === "/authentication/sign-in" ||
              router.pathname === "/authentication/sign-up" ||
              router.pathname === "/authentication/forgot-password" ||
              router.pathname === "/authentication/lock-screen" ||
              router.pathname === "/authentication/confirm-mail" ||
              router.pathname === "/authentication/logout" ||
              router.pathname === "/restaurant/dashboard"
            ) && <Footer />}
          </div>
        </div>

        {/* ScrollToTop */}
        <ScrollToTop />

        {/* Theme Effects */}
        <SnowEffect />
        <NewYearEffect />
        <HolidayGreeting />

        {!(
          router.pathname === "/authentication/sign-in" ||
          router.pathname === "/authentication/sign-up" ||
          router.pathname === "/authentication/forgot-password" ||
          router.pathname === "/authentication/lock-screen" ||
          router.pathname === "/authentication/confirm-mail" ||
          router.pathname === "/authentication/logout" ||
          router.pathname === "/restaurant/dashboard"
        ) && <ControlPanelModal />}
        <HidableButtons />
      </>
      </TopbarContext.Provider>
    </CurrencyProvider>
  );
};

export default Layout;
