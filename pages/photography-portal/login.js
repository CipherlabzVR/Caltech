import React, { useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  CircularProgress,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

const BRAND = {
  primary: "#6a11cb",
  primaryDark: "#4a0c8f",
  accent: "#2575fc",
  ink: "#241b3a",
  inkSoft: "#6b6483",
  bgGradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
};

export default function PhotographyPortalLogin() {
  const router = useRouter();
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const codeRef = useRef(null);

  const requestOtp = async () => {
    if (!mobile.trim()) {
      toast.error("Please enter your mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/PhotographyPortal/RequestOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MobileNo: mobile.trim() }),
      });
      const json = await res.json();
      const sc = json.statusCode ?? json.StatusCode;
      const msg = json.message ?? json.Message ?? "";
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(msg || "Code sent to your WhatsApp.");
        setStep("otp");
        setTimeout(() => codeRef.current?.focus(), 150);
      } else {
        toast.error(msg || "Could not send the code.");
      }
    } catch (e) {
      toast.error(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/PhotographyPortal/VerifyOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MobileNo: mobile.trim(), Code: code.trim() }),
      });
      const json = await res.json();
      const sc = json.statusCode ?? json.StatusCode;
      const msg = json.message ?? json.Message ?? "";
      if (sc === 200 || sc === "SUCCESS") {
        const result = json.result ?? json.Result ?? {};
        const token = result.token ?? result.Token;
        if (!token) {
          toast.error("Login failed: no session token returned.");
          return;
        }
        localStorage.setItem("token", token);
        localStorage.setItem("photoPortalMobile", result.mobileNo ?? mobile.trim());
        router.push("/photography-portal");
      } else {
        toast.error(msg || "Invalid code.");
      }
    } catch (e) {
      toast.error(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: BRAND.bgGradient,
      }}
    >
      <ToastContainer />
      <Paper
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            background: BRAND.bgGradient,
          }}
        >
          <PhotoCameraIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h5" fontWeight={800} sx={{ color: BRAND.ink }}>
          Photography Portal
        </Typography>
        <Typography variant="body2" sx={{ color: BRAND.inkSoft, mb: 3 }}>
          Track your reservation and event status
        </Typography>

        {step === "mobile" ? (
          <Stack spacing={2}>
            <TextField
              label="Mobile / WhatsApp Number"
              fullWidth
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && requestOtp()}
              placeholder="e.g. 0771234567"
              autoFocus
            />
            <Button
              variant="contained"
              size="large"
              onClick={requestOtp}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <WhatsAppIcon />}
              sx={{
                background: BRAND.bgGradient,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                py: 1.2,
              }}
            >
              {loading ? "Sending…" : "Send code via WhatsApp"}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: BRAND.inkSoft }}>
              We sent a 6-digit code to <b>{mobile}</b> on WhatsApp.
            </Typography>
            <TextField
              label="Verification Code"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              inputProps={{ inputMode: "numeric", style: { letterSpacing: 6, textAlign: "center", fontSize: 22 } }}
              inputRef={codeRef}
            />
            <Button
              variant="contained"
              size="large"
              onClick={verifyOtp}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                background: BRAND.bgGradient,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                py: 1.2,
              }}
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </Button>
            <Stack direction="row" justifyContent="space-between">
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => setStep("mobile")}
                sx={{ textTransform: "none", color: BRAND.inkSoft }}
              >
                Change number
              </Button>
              <Button
                size="small"
                onClick={requestOtp}
                disabled={loading}
                sx={{ textTransform: "none", color: BRAND.primary }}
              >
                Resend code
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

PhotographyPortalLogin.disableLayout = true;
