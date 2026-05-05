import BASE_URL from "Base/api";
import getDeviceName from "@/components/utils/getDeviceName";

/** Resets client idle tracking so a fresh login is not treated as an expired session. */
export const touchSessionActivity = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("lastActivityTime", String(Date.now()));
};

const logoutUser = async ({ router, redirectPath = "/authentication/sign-in/" } = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  const token = localStorage.getItem("token");

  if (token) {
    try {
      await fetch(`${BASE_URL}/User/Logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Device-Name": getDeviceName(),
        },
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  }

  localStorage.clear();
  sessionStorage.removeItem("holidayGreetingShown");

  if (router?.replace) {
    await router.replace(redirectPath);
    window.location.reload();
    return;
  }

  window.location.href = redirectPath;
};

export default logoutUser;
