import SignInForm from "@/components/Authentication/SignInForm";
import { CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useRouter } from "next/router";

function defaultHomeForUserType() {
  if (typeof window === "undefined") return "/";
  const t = Number(localStorage.getItem("type"));
  return t === 15 ? "/customer-portal" : "/";
}

export default function SignIn({ portalCustomerLogin = false }) {
  const router = useRouter();
  const tk =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [token, setToken] = useState(tk);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const next = localStorage.getItem("token");
      setToken(next);
      const timeoutId = setTimeout(() => setHydrated(true), 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      router.replace(defaultHomeForUserType());
    }
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
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
    );
  }

  if (token == null) {
    return (
      <>
        <ToastContainer />
        <SignInForm portalCustomerEntry={portalCustomerLogin} />
      </>
    );
  }
  return null;
}
