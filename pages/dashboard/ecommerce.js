import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Typography, Box, CircularProgress } from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import EcommerceDashboard from "@/components/Dashboard/eCommerce/EcommerceDashboard";
import BASE_URL from "Base/api";

/** Same navigation permission as Online Orders (E-Commerce admin). */
const ECOMMERCE_DASHBOARD_CATEGORY_ID = 108;

export default function EcommerceDashboardPage() {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!role || !token) {
      setAccess(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/User/GetModuleCategoryNavigationPermissions?roleId=${role}&categoryId=${ECOMMERCE_DASHBOARD_CATEGORY_ID}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          if (!cancelled) setAccess(false);
          return;
        }
        const data = await response.json();
        if (!cancelled) setAccess(!!data.result);
      } catch {
        if (!cancelled) setAccess(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (access === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!access) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Access denied
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You do not have navigation permission for the E-Commerce dashboard. Ask an administrator to grant
          access to Online Orders (E-Commerce admin) in role permissions.
        </Typography>
        <Link href="/dashboard/main">Back to main dashboard</Link>
      </Box>
    );
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>E-Commerce Dashboard</h1>
        <ul>
          <li>
            <Link href="/dashboard/main">Dashboard</Link>
          </li>
          <li>E-Commerce</li>
        </ul>
      </div>

      <EcommerceDashboard />
    </>
  );
}
