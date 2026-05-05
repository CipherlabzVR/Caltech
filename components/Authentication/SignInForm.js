import React, { useState } from "react";
import Link from "next/link";
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import "react-toastify/dist/ReactToastify.css";
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import getDeviceName from "@/components/utils/getDeviceName";
import { getDeviceIdentity } from "@/components/utils/getDeviceId";
import DeviceNameDialog from "@/components/Authentication/DeviceNameDialog";
import TwoFactorChallengeDialog from "@/components/Authentication/TwoFactorChallengeDialog";

const SignInForm = () => {
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginNote, setLoginNote] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [loginResult, setLoginResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState({
    open: false,
    email: "",
    challengeToken: "",
    availableChannels: [],
    sentChannel: "",
    sentRecipient: "",
    expiresInMinutes: 10,
    initialLocked: false,
    initialLockoutEndsAt: "",
    initialError: "",
  });
  const router = useRouter();

  const finalizeLogin = (result) => {
    localStorage.setItem("token", result.accessToken);
    localStorage.setItem("user", result.email);
    localStorage.setItem("userid", result.id);
    localStorage.setItem("name", result.firstName);
    localStorage.setItem("type", result.userType);
    localStorage.setItem("warehouse", result.warehouseId);
    localStorage.setItem("company", result.companyId);
    localStorage.setItem("role", result.userRole);

    sessionStorage.removeItem("holidayGreetingShown");
    sessionStorage.setItem("justLoggedIn", "true");

    fetch(`${BASE_URL}/Company/CreateCompanyHostingFeeIfDue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${result.accessToken}`,
        "Content-Type": "application/json",
      },
    }).catch(() => {});

    if (result.isNewDevice) {
      setLoginResult(result);
      setDeviceNameInput(getDeviceName());
      setDeviceDialogOpen(true);
      return;
    }

    router.push("/");
    window.location.reload();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");
    const password = data.get("password");

    if (!email || !password) {
      setShowError(true);
      return;
    }

    setLoginNote("");
    setSubmitting(true);

    try {
      const identity = await getDeviceIdentity();
      const response = await fetch(`${BASE_URL}/User/SignIn`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(identity.deviceFingerprint
            ? { "X-Device-Fingerprint": identity.deviceFingerprint }
            : {}),
          ...(identity.browserInstanceId
            ? { "X-Browser-Instance-Id": identity.browserInstanceId }
            : {}),
        },
        body: JSON.stringify({
          Email: email,
          Password: password,
          DeviceName: getDeviceName(),
          DeviceIdentifier: identity.deviceIdentifier,
          DeviceId: identity.deviceIdentifier,
          DeviceFingerprint: identity.deviceFingerprint,
          BrowserInstanceId: identity.browserInstanceId,
        }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Login failed");
      }

      const result = responseData.result;

      // Backend returned a FAILED ApiResponse (e.g. lockout). HTTP is still 200
      // because the controller wraps responses in Ok(...). Inspect statusCode +
      // result.locked so we can show the locked dialog instead of a generic toast.
      if (responseData.statusCode !== 200) {
        if (result?.locked) {
          setTwoFactorState({
            open: true,
            email,
            challengeToken: "",
            availableChannels: [],
            sentChannel: "",
            sentRecipient: "",
            expiresInMinutes: 10,
            initialLocked: true,
            initialLockoutEndsAt: result.lockoutEndsAt || "",
            initialError: responseData.message || "Account temporarily locked.",
          });
          setSubmitting(false);
          return;
        }
        throw new Error(responseData.message || "Login failed");
      }

      if (result?.requiresTwoFactor) {
        setTwoFactorState({
          open: true,
          email,
          challengeToken: result.twoFactorChallengeToken || "",
          availableChannels: result.availableTwoFactorChannels || [],
          sentChannel: result.twoFactorSentChannel || "",
          sentRecipient: result.twoFactorSentRecipient || "",
          expiresInMinutes: result.twoFactorOtpExpiresInMinutes || 10,
          initialLocked: false,
          initialLockoutEndsAt: "",
          initialError: "",
        });
        // No OTP is sent yet — the user picks a channel inside the dialog,
        // which then triggers SendTwoFactorLoginOtp. So no "code sent" toast here.
        setSubmitting(false);
        return;
      }

      finalizeLogin(result);
    } catch (error) {
      const message = error.message || "Login failed";

      const lowered = message.toLowerCase();
      if (
        lowered.includes("registered device") ||
        lowered.includes("device limit") ||
        lowered.includes("maximum") ||
        lowered.includes("contact admin")
      ) {
        setLoginNote(message);
        setSubmitting(false);
        return;
      }

      toast.error(message);
      setSubmitting(false);
    }
  };

  const isLockoutMessage = (msg) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes("too many") || lower.includes("try again in") || lower.includes("temporarily locked");
  };

  // Extract structured lockout fields from the API result so the dialog can show
  // "X attempts left" and the lockout end-time even if the backend stops including
  // them inline in the message.
  const extractLockoutInfo = (data, msg) => {
    const r = data?.result || {};
    const locked = !!r.locked || isLockoutMessage(msg);
    return {
      locked,
      lockoutEndsAt: r.lockoutEndsAt || "",
      attemptsLeft: typeof r.attemptsLeft === "number" ? r.attemptsLeft : null,
      maxAttempts: typeof r.maxAttempts === "number" ? r.maxAttempts : null,
      lockoutMinutes: typeof r.lockoutMinutes === "number" ? r.lockoutMinutes : null,
    };
  };

  const handleResendTwoFactorOtp = async (channel) => {
    try {
      const response = await fetch(`${BASE_URL}/User/SendTwoFactorLoginOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: twoFactorState.email,
          ChallengeToken: twoFactorState.challengeToken,
          Channel: channel,
        }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        toast.success(data.message || "Verification code sent.");
        setTwoFactorState((prev) => ({
          ...prev,
          sentChannel: data?.result?.channel || channel,
          sentRecipient: data?.result?.recipient || "",
          expiresInMinutes: data?.result?.expiresInMinutes || prev.expiresInMinutes,
        }));
        return { success: true };
      }
      const msg = data?.message || "Could not send the verification code.";
      toast.error(msg);
      return { success: false, message: msg, ...extractLockoutInfo(data, msg) };
    } catch (error) {
      const msg = error.message || "Could not send the verification code.";
      toast.error(msg);
      return { success: false, message: msg, locked: isLockoutMessage(msg) };
    }
  };

  const handleVerifyTwoFactorLogin = async (otp) => {
    try {
      const identity = await getDeviceIdentity();
      const response = await fetch(`${BASE_URL}/User/VerifyTwoFactorLogin`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(identity.deviceFingerprint
            ? { "X-Device-Fingerprint": identity.deviceFingerprint }
            : {}),
          ...(identity.browserInstanceId
            ? { "X-Browser-Instance-Id": identity.browserInstanceId }
            : {}),
        },
        body: JSON.stringify({
          Email: twoFactorState.email,
          ChallengeToken: twoFactorState.challengeToken,
          Channel: twoFactorState.sentChannel,
          Otp: otp,
          DeviceName: getDeviceName(),
          DeviceIdentifier: identity.deviceIdentifier,
          DeviceId: identity.deviceIdentifier,
          DeviceFingerprint: identity.deviceFingerprint,
          BrowserInstanceId: identity.browserInstanceId,
        }),
      });
      const data = await response.json();
      if (data?.statusCode === 200 && data.result?.accessToken) {
        toast.success("Verified. Signing you in...");
        setTwoFactorState((prev) => ({ ...prev, open: false }));
        finalizeLogin(data.result);
        return { success: true };
      }
      const msg = data?.message || "Verification failed.";
      toast.error(msg);
      return { success: false, message: msg, ...extractLockoutInfo(data, msg) };
    } catch (error) {
      const msg = error.message || "Verification failed.";
      toast.error(msg);
      return { success: false, message: msg, locked: isLockoutMessage(msg) };
    }
  };

  const handleCancelTwoFactor = () => {
    setTwoFactorState((prev) => ({ ...prev, open: false }));
  };

  const handleDeviceDialogCancel = () => {
    setDeviceDialogOpen(false);
    router.push("/");
    window.location.reload();
  };

  const handleDeviceDialogConfirm = async () => {
    const trimmed = deviceNameInput.trim();
    if (!trimmed || !loginResult) return;

    const token = loginResult.accessToken || loginResult.AccessToken;
    const deviceRowId =
      loginResult.currentLoggedInDeviceId ?? loginResult.CurrentLoggedInDeviceId ?? null;

    const isRenameSuccess = (data) => {
      const sc = data?.statusCode ?? data?.StatusCode;
      return Number(sc) === 200;
    };

    try {
      const identity = await getDeviceIdentity();
      const idQuery =
        deviceRowId != null
          ? `&loggedInDeviceIpId=${encodeURIComponent(String(deviceRowId))}`
          : "";
      const renameUrl =
        `${BASE_URL}/User/RenameCurrentDevice?newDeviceName=${encodeURIComponent(trimmed)}` +
        `&deviceIdentifier=${encodeURIComponent(identity.deviceIdentifier || "")}` +
        (identity.deviceFingerprint
          ? `&deviceFingerprint=${encodeURIComponent(identity.deviceFingerprint)}`
          : "") +
        (identity.browserInstanceId
          ? `&browserInstanceId=${encodeURIComponent(identity.browserInstanceId)}`
          : "") +
        idQuery;
      const response = await fetch(renameUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(identity.deviceFingerprint
            ? { "X-Device-Fingerprint": identity.deviceFingerprint }
            : {}),
          ...(identity.browserInstanceId
            ? { "X-Browser-Instance-Id": identity.browserInstanceId }
            : {}),
        },
        body: JSON.stringify({
          NewDeviceName: trimmed,
          DeviceIdentifier: identity.deviceIdentifier,
          DeviceId: identity.deviceIdentifier,
          DeviceFingerprint: identity.deviceFingerprint,
          BrowserInstanceId: identity.browserInstanceId,
          ...(deviceRowId != null ? { LoggedInDeviceIpId: deviceRowId } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !isRenameSuccess(data)) {
        toast.error(data?.message || "Could not save device name. Please try again.");
        return;
      }
    } catch {
      toast.error("Could not save device name. Please try again.");
      return;
    }

    setDeviceDialogOpen(false);
    router.push("/");
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f2f5",
        p: 2,
      }}
    >
      <Grid
        container
        sx={{
          maxWidth: 800,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
          backgroundColor: "#fff",
        }}
      >
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            backgroundColor: "#5e81f4",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            textAlign: "center",
            borderTopRightRadius: { md: "120px" },
            borderBottomRightRadius: { md: "120px" },
          }}
        >
          <Typography variant="h4" fontWeight={700} mb={1}>
            Welcome Back!
          </Typography>
          <Typography variant="body2">
            Log in to access your account and continue where you left off.
          </Typography>
        </Grid>

        <Grid item xs={12} md={7} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Login
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            {showError && (
              <Typography color="error" fontSize={13} mb={2}>
                Please fill in all required fields.
              </Typography>
            )}

            {loginNote && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {loginNote}
              </Alert>
            )}

            <TextField
              fullWidth
              margin="normal"
              name="email"
              label="Email Address"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={1}
            >
              <FormControlLabel
                control={<Checkbox color="primary" />}
                label="Remember me"
              />
              <Link
                href="/authentication/forgot-password"
                style={{
                  fontSize: 14,
                  color: "#5e81f4",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                mt: 3,
                py: 1.3,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: "8px",
                backgroundColor: "#5e81f4",
                "&:hover": { backgroundColor: "#4a6fd0" },
              }}
            >
              {submitting ? "Signing in..." : "Login"}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              mt={3}
            >
              or login with social platforms
            </Typography>

            <Box display="flex" justifyContent="center" gap={2} mt={1}>
              <IconButton variant="outlined" size="small">
                <FacebookIcon/>
              </IconButton>
              <IconButton variant="outlined" size="small">
                <WhatsAppIcon/>
              </IconButton>
              <IconButton variant="outlined" size="small">
                <LinkedInIcon/>
              </IconButton>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <DeviceNameDialog
        open={deviceDialogOpen}
        value={deviceNameInput}
        onChange={setDeviceNameInput}
        onCancel={handleDeviceDialogCancel}
        onConfirm={handleDeviceDialogConfirm}
      />
      <TwoFactorChallengeDialog
        open={twoFactorState.open}
        availableChannels={twoFactorState.availableChannels}
        sentChannel={twoFactorState.sentChannel}
        sentRecipient={twoFactorState.sentRecipient}
        expiresInMinutes={twoFactorState.expiresInMinutes}
        initialLocked={twoFactorState.initialLocked}
        initialLockoutEndsAt={twoFactorState.initialLockoutEndsAt}
        initialError={twoFactorState.initialError}
        onResend={handleResendTwoFactorOtp}
        onVerify={handleVerifyTwoFactorLogin}
        onCancel={handleCancelTwoFactor}
      />
    </Box>
  );
};

export default SignInForm;
