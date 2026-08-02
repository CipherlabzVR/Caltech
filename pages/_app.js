// import React, { useEffect, useState } from "react";
// import "../styles/remixicon.css";
// import "react-tabs/style/react-tabs.css";
// import "swiper/css";
// import "swiper/css/bundle";
// import "../styles/chat.css";
// import "../styles/globals.css";
// import "../styles/rtl.css";
// import "../styles/dark.css";
// import theme from "../styles/theme";

// import { ThemeProvider, CssBaseline, CircularProgress } from "@mui/material";
// import Layout from "@/components/_App/Layout";
// import SignIn from "./authentication/sign-in";
// import { ProjectNo } from "Base/catelogue";

// function MyApp({ Component, pageProps }) {
//   const tk =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   const [token, setToken] = useState(tk);
//   const [hydrated, setHydrated] = useState(false);
//   const [landingVisible, setLandingVisible] = useState(true);
//   const [landingSlideUp, setLandingSlideUp] = useState(false);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const token = localStorage.getItem("token");
//       setToken(token);
//       const timeoutId = setTimeout(() => setHydrated(true), 100);
//       return () => clearTimeout(timeoutId);
//     }
//   }, []);

//    useEffect(() => {
//     const handleSpaceKey = (e) => {
//       if (e.keyCode === 32) {
//         e.preventDefault();
//         setLandingSlideUp(true);
//         setTimeout(() => {
//           setLandingVisible(false);
//         }, 600);
//       }
//     };

//     if (landingVisible) {
//       window.addEventListener("keydown", handleSpaceKey);
//     }

//     return () => {
//       window.removeEventListener("keydown", handleSpaceKey);
//     };
//   }, [landingVisible]);


//   if (!hydrated) {
//     return <div style={{width: '100vw',height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
//       <CircularProgress />
//     </div>;
//   }

//   function clearLocalStorageDaily() {
//     var now = new Date();
//     var clearTime = new Date();
//     clearTime.setHours(3);
//     clearTime.setMinutes(0);
//     clearTime.setSeconds(0);
//     if (now.getHours() >= 3) {
//       clearTime.setDate(clearTime.getDate() + 1);
//     }

//     var timeUntilClear = clearTime.getTime() - now.getTime();
//     setTimeout(function() {
//       localStorage.clear();      
//       console.log("Local storage cleared at 3 am.");
//       clearLocalStorageDaily();
//       window.location.reload();
//     }, timeUntilClear);
//   }
//   clearLocalStorageDaily();

//   if (token == null && landingVisible) {
//     return (
//       <div className={`landing-page ${landingSlideUp ? "slide-up" : ""}`}>
//         <div className="landing-content">
//           {ProjectNo === 1 ? <img src="/images/clovesis.png" alt="Logo" className="landing-logo" /> : <img src="/images/DBlogo.png" alt="Logo" className="landing-logo" />}
//         </div>
//       </div>
//     );
//   }


//   if (token == null) {
//     return <SignIn />;
//   }

//   return (
//     <>
//       <ThemeProvider theme={theme}>
//         <CssBaseline />
//         <Layout>
//           <Component {...pageProps} />
//         </Layout>
//       </ThemeProvider>
//     </>
//   );
// }

// export default MyApp;


import React, { useCallback, useEffect, useRef, useState } from "react";
import "../styles/remixicon.css";
import "react-tabs/style/react-tabs.css";
import "swiper/css";
import "swiper/css/bundle";
import "../styles/chat.css";
import "../styles/globals.css";
import "../styles/rtl.css";
import "../styles/dark.css";
import "../styles/calendar.css";
import "../styles/ai-assistant.css";
import "react-toastify/dist/ReactToastify.css";
import theme from "../styles/theme";
import SignIn from "./authentication/sign-in";

import { ThemeProvider, CssBaseline, CircularProgress } from "@mui/material";
import Layout from "@/components/_App/Layout";
import { useRouter } from "next/router";
import { ProjectNo } from "Base/catelogue";
import BASE_URL from "Base/api";
import Calendar from "./reservation/calendar";
import getSettingValueByName from "@/components/utils/getSettingValueByName";
import logoutUser, { touchSessionActivity } from "@/components/utils/logoutUser";


const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 12 * 60;

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const tk = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [token, setToken] = useState(tk);
  const [hydrated, setHydrated] = useState(false);
  const [landingVisible, setLandingVisible] = useState(true);
  const [landingSlideUp, setLandingSlideUp] = useState(false);
  const inactivityTimerRef = useRef(null);
  const hasLoggedOutRef = useRef(false);
  const { data: autoLogoutTimeMinutes } = getSettingValueByName("AutoLogoutTimeMinutes");
  const parsedAutoLogoutMinutes = Number.parseInt(`${autoLogoutTimeMinutes ?? ""}`, 10);
  const INACTIVITY_TIMEOUT_MS =
    !Number.isNaN(parsedAutoLogoutMinutes) && parsedAutoLogoutMinutes > 0
      ? parsedAutoLogoutMinutes * 60 * 1000
      : DEFAULT_INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;


  const markActivity = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("lastActivityTime", Date.now().toString());
  }, []);

  const handleForceLogout = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (hasLoggedOutRef.current) {
      return;
    }
    hasLoggedOutRef.current = true;
    setToken(null);
    await logoutUser({ router });
  }, [router]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const nextToken = localStorage.getItem("token");
      setToken(nextToken);
      if (nextToken && sessionStorage.getItem("justLoggedIn") === "true") {
        touchSessionActivity();
        sessionStorage.removeItem("justLoggedIn");
      }
      const timeoutId = setTimeout(() => setHydrated(true), 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Prevent mouse wheel from changing number input values on transaction screens.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWheel = (event) => {
      const active = document.activeElement;
      if (active?.matches?.('input[type="number"]')) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Self-register this site's origin with the ERP backend so CORS allows it.
  // Fires once per browser session; failures are ignored (origin may already exist).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const origin = window.location.origin;
      const flagKey = `corsRegistered:${origin}`;
      if (sessionStorage.getItem(flagKey) === "true") return;
      fetch(`${BASE_URL}/AppSetting/SaveCorsLink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webLink: origin, isActive: true }),
      })
        .then(() => sessionStorage.setItem(flagKey, "true"))
        .catch(() => { });
    } catch (_) { }
  }, []);

  useEffect(() => {
    const handleSpaceKey = (e) => {
      if (e.keyCode === 32) {
        e.preventDefault();
        setLandingSlideUp(true);
        setTimeout(() => {
          setLandingVisible(false);
        }, 600);
      }
    };

    if (landingVisible) {
      window.addEventListener("keydown", handleSpaceKey);
    }

    return () => {
      window.removeEventListener("keydown", handleSpaceKey);
    };
  }, [landingVisible]);

  useEffect(() => {
    if (typeof window !== "undefined" && token == null) {
      const handleKeyDownOrClick = (e) => {
        if (e.key === " " || e.key === "Enter" || e.type === "click") {
          setLandingSlideUp(true);
          setTimeout(() => setLandingVisible(false), 600);
        }
      };

      window.addEventListener("keydown", handleKeyDownOrClick);
      window.addEventListener("click", handleKeyDownOrClick);

      return () => {
        window.removeEventListener("keydown", handleKeyDownOrClick);
        window.removeEventListener("click", handleKeyDownOrClick);
      };
    }
  }, [token]);

  // Register this host with the ERP API CORS allowlist (SaveCorsLink). Once per tab session;
  // uses window.location.origin — works on landing, sign-in, and inside the app after login.
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }

    const appOrigin = window.location.origin;
    if (!appOrigin) {
      return;
    }

    const sessionKey = "__apexflowSaveCorsOrigin";
    if (sessionStorage.getItem(sessionKey) === appOrigin) {
      return;
    }

    fetch(`${BASE_URL}/AppSetting/SaveCorsLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webLink: appOrigin,
        isActive: true,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        sessionStorage.setItem(sessionKey, appOrigin);
      })
      .catch(() => {
        // Non-blocking fire-and-forget so startup is never blocked.
      });
  }, [hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (event) => {
      if (event.key === "token" && !event.newValue) {
        handleForceLogout();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleForceLogout]);

  useEffect(() => {
    if (typeof window === "undefined" || !token) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Avoid evaluating stale idle timestamps before the shell has hydrated; otherwise
    // a post-login full reload can clear the new session immediately.
    if (!hydrated) {
      return;
    }

    hasLoggedOutRef.current = false;

    const storedInitial = localStorage.getItem("lastActivityTime");
    if (storedInitial) {
      const lastActiveInitial = parseInt(storedInitial, 10);
      if (!Number.isNaN(lastActiveInitial) && Date.now() - lastActiveInitial >= INACTIVITY_TIMEOUT_MS) {
        handleForceLogout();
        return;
      }
    }

    const startInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        const stored = localStorage.getItem("lastActivityTime");
        const lastActive = stored ? parseInt(stored, 10) : 0;
        if (!lastActive || Number.isNaN(lastActive) || Date.now() - lastActive >= INACTIVITY_TIMEOUT_MS) {
          handleForceLogout();
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleUserActivity = () => {
      markActivity();
      startInactivityTimer();
    };

    const validateSession = () => {
      const stored = localStorage.getItem("lastActivityTime");
      const lastActive = stored ? parseInt(stored, 10) : 0;
      if (!lastActive || Number.isNaN(lastActive)) {
        handleUserActivity();
        return;
      }

      if (Date.now() - lastActive < INACTIVITY_TIMEOUT_MS) {
        handleUserActivity();
        return;
      }

      handleForceLogout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        validateSession();
      } else {
        markActivity();
      }
    };

    const handleWindowFocus = () => validateSession();
    const handleUnload = () => markActivity();

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleUserActivity, true)
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    // Initialize last activity and timer on mount
    handleUserActivity();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleUserActivity, true)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [handleForceLogout, markActivity, token, INACTIVITY_TIMEOUT_MS, hydrated]);


  function clearLocalStorageDaily() {
    var now = new Date();
    var clearTime = new Date();
    clearTime.setHours(3);
    clearTime.setMinutes(0);
    clearTime.setSeconds(0);
    if (now.getHours() >= 3) {
      clearTime.setDate(clearTime.getDate() + 1);
    }

    var timeUntilClear = clearTime.getTime() - now.getTime();
    setTimeout(async function () {
      await logoutUser({ router });
      clearLocalStorageDaily();
    }, timeUntilClear);
  }
  clearLocalStorageDaily();

  if (!hydrated) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </div>
    );
  }

  // Exclude standalone print/share pages from layout and token check
  const noLayoutRoutes = [
    "/crm/customer/quote",
    "/crm/customer/invoice",
    "/inventory/purchase-order/print",
    "/service/purchase-invoice/print",
    "/inventory/grn/print",
    "/inventory/grn-return/print",
    "/service/service-invoice/print",
    "/service/job-card/print",
    "/service/job-card/receipt/[id]",
    "/service/job-card/work-authorization/[id]",
    "/inventory/shipment/print",
    "/inventory/stock-dispatch/print",
    "/inventory/stock-adjustment/print",
    "/inventory/stock-details/print",
    "/reports/stock-balance/print",
    "/reports/stock-movement/print",
    "/reports/purchase-order-notes-summary/print",
    "/reports/goods-received-notes-summary/print",
    "/reports/shipment-summary/print",
    "/reports/sales-summary/print",
    "/reports/customer-payment-summary/print",
    "/reports/outstanding-report/print",
    "/reports/shift-summary/print",
    "/reports/bank-history/print",
    "/reports/cash-book-summary/print",
    "/reports/cash-flow-summary/print",
    "/reports/profitability-report/print",
    "/reports/company-wise-profit/print",
    "/inventory/shipment/view",
    "/work-track/share/[token]",
    "/work-track/share/[token]/form/[detailId]",
    "/inventory/stock-cycle-count/print",
    "/sales/sales-quotation/print",
    "/quotations/tech-pack/sewing/packing-print",
    "/quotations/tech-pack/sewing/emb-sub-print",
    "/quotations/tech-pack/sewing/cutting-print",
    "/verified",
    "/userverified",
    "/authentication/forgot-password",
    "/sales/sales-order/print",
    "/sales/shipment-invoice/print",
    "/sales/day-end/print",
    "/sales/sales-return/print",
    "/sales/pos-shift/print",
    "/sales/pos-dayend/print",
    "/sales/cash-in-out/print",
    "/sales/daily-outstandings/print",
    "/sales/invoice/print",
    "/sales/deposit/print",
    "/sales/credit-note/print",
    "/finance/payments/print"
  ];

  // trailingSlash: true can leave a trailing "/" on asPath; normalize so print pages
  // always skip the ERP shell (sidebar/header) and show report-only.
  const stripTrailingSlash = (path = "") => {
    if (!path || path === "/") return "/";
    return path.replace(/\/+$/, "");
  };
  const publicPath = stripTrailingSlash((router.asPath || "").split("?")[0].split("#")[0]);
  const currentPathname = stripTrailingSlash(router.pathname || "");
  const isPublicStandaloneRoute =
    noLayoutRoutes.some((route) => {
      const normalized = stripTrailingSlash(route);
      return normalized === currentPathname || normalized === publicPath;
    }) || publicPath.startsWith("/work-track/share");

  const shouldUseLayout = !isPublicStandaloneRoute;
  const shouldCheckToken = !isPublicStandaloneRoute;

  // Customer portal users (UserType.EXTERNAL = 15): never paint the ERP layout/dashboard —
  // show a spinner and go straight to the portal.
  if (typeof window !== "undefined" && token) {
    const userType = Number(localStorage.getItem("type"));
    if (userType === 15 && router.pathname !== "/customer-portal" && !isPublicStandaloneRoute) {
      router.replace("/customer-portal");
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </div>
        </ThemeProvider>
      );
    }
  }

  if (token == null && landingVisible && shouldCheckToken) {
    return (
      <div className={`landing-page ${landingSlideUp ? "slide-up" : ""}`}>
        <div className="landing-content">
          {ProjectNo === 1 ? <img src="/images/cbass-2.png" alt="Logo" className="landing-logo" /> : <img src="/images/DBlogo.png" alt="Logo" className="landing-logo" />}

        </div>
      </div>
    );
  }

  if (token == null && shouldCheckToken) {
    if (ProjectNo === 1) {
      const portalCustomerLogin = router.pathname === "/authentication/customer-sign-in";
      return <SignIn portalCustomerLogin={portalCustomerLogin} />;
    }

    return <Calendar />;
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {shouldUseLayout ? (
          <Layout>
            <Component key={router.asPath} {...pageProps} />
          </Layout>
        ) : (
          <Component key={router.asPath} {...pageProps} />
        )}
      </ThemeProvider>
    </>
  );
}

export default MyApp;
