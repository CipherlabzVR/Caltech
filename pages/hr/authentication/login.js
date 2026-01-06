import HRLoginForm from "@/components/HR/Authentication/HRLoginForm";
import { CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useRouter } from 'next/router';

export default function HRLogin() {
  const router = useRouter();
  const tk =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [token, setToken] = useState(tk);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setToken(token);
      const timeoutId = setTimeout(() => setHydrated(true), 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (hydrated && token) {
      router.push('/hr');
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
        <HRLoginForm />
      </>
    );
  }
  return null;
}

