import React, { useState } from "react";
import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

export default function SendPortalLink({ item }) {
  const [loading, setLoading] = useState(false);
  const mobile = item?.customerMobileNo;
  const hasMobile = Boolean(mobile && String(mobile).trim());

  const send = async () => {
    if (!hasMobile) {
      toast.warning("Add a customer mobile number before sending the portal link.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const isLocal = /localhost|127\.0\.0\.1/i.test(hostname);
      const portalBaseUrl = !isLocal && typeof window !== "undefined" ? window.location.origin : null;

      const res = await fetch(
        `${BASE_URL}/PhotographyReservation/SendCustomerPortalLink?id=${item.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ PortalBaseUrl: portalBaseUrl }),
        }
      );
      const json = await res.json();
      const sc = json.statusCode ?? json.StatusCode;
      const msg = json.message ?? json.Message ?? "";
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(msg || "Portal link sent via WhatsApp.");
      } else {
        toast.error(msg || "Could not send the portal link.");
      }
    } catch (e) {
      toast.error(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip
      title={
        hasMobile
          ? "Send customer portal link via WhatsApp"
          : "No customer mobile number"
      }
      placement="top"
    >
      <span>
        <IconButton
          size="small"
          onClick={send}
          disabled={loading || !hasMobile}
          aria-label="send portal link"
          sx={{ color: hasMobile ? "#25D366" : "action.disabled" }}
        >
          {loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <WhatsAppIcon fontSize="inherit" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
