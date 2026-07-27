import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import QuickAccessContent from "@/components/quickaccess/QuickAccessContent";
import WelcomeHero from "@/components/landing/WelcomeHero";
import { TopbarContext } from "@/components/_App/TopbarContext";

const MOBILE_VIEWPORT_MAX = 1199;

const Landing = () => {
  const { activeButton } = useContext(TopbarContext);
  const router = useRouter();
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileView(window.innerWidth <= MOBILE_VIEWPORT_MAX);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    // Check if user is helpdesksupport (UserType 14) and redirect to self dashboard
    if (typeof window !== "undefined") {
      const userType = localStorage.getItem("type");
      // UserType.HelpDeskSupport = 14
      if (userType === "14" || userType === 14) {
        // Only redirect if we're on the home page and not already on the self dashboard
        if (router.pathname === "/" && activeButton !== "quick-access") {
          router.push("/dashboard/help-desk/self");
        }
      }
    }
  }, [router, activeButton]);

  if (isMobileView) {
    return <QuickAccessContent />;
  }

  return <WelcomeHero />;
};

export default Landing;