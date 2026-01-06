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
import "react-toastify/dist/ReactToastify.css";
import theme from "../styles/theme";
import SignIn from "./authentication/sign-in";

import { ThemeProvider, CssBaseline, CircularProgress } from "@mui/material";
import Layout from "@/components/_App/Layout";
import { useRouter } from "next/router";
import { ProjectNo } from "Base/catelogue";
import Calendar from "./reservation/calendar";
import getSettingValueByName from "@/components/utils/getSettingValueByName";


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

  const handleForceLogout = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (hasLoggedOutRef.current) {
      return;
    }
    hasLoggedOutRef.current = true;
    localStorage.clear();
    sessionStorage.removeItem("holidayGreetingShown");
    setToken(null);
    router.replace("/authentication/sign-in/");
  }, [router]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setToken(token);
      const timeoutId = setTimeout(() => setHydrated(true), 100);
      return () => clearTimeout(timeoutId);
    }
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
  }, [handleForceLogout, markActivity, token, INACTIVITY_TIMEOUT_MS]);


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
    setTimeout(function () {
      localStorage.clear();
      clearLocalStorageDaily();
      window.location.reload();
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

  if (token == null && landingVisible) {
    return (
      <div className={`landing-page ${landingSlideUp ? "slide-up" : ""}`}>
        <div className="landing-content">
          {ProjectNo === 1 ? <img src="/images/cbass-2.png" alt="Logo" className="landing-logo" /> : <img src="/images/DBlogo.png" alt="Logo" className="landing-logo" />}

        </div>
      </div>
    );
  }

  // Exclude customer/quote and customer/invoice pages from layout and token check
  const noLayoutRoutes = ["/crm/customer/quote", "/crm/customer/invoice", "/verified", "/userverified"];
  const shouldUseLayout = !noLayoutRoutes.includes(router.pathname);
  const shouldCheckToken = !noLayoutRoutes.includes(router.pathname);

  if (token == null && shouldCheckToken) {
    if (ProjectNo === 1) {
      return <SignIn /> ;
    } else {
      return <Calendar />;
    }

  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {shouldUseLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
      </ThemeProvider>
    </>
  );
}

export default MyApp;
