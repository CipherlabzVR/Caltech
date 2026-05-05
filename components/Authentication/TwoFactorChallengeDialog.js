import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Slide,
  Fade,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CHANNEL_ICON = {
  Email: <EmailOutlinedIcon sx={{ fontSize: 18 }} />,
  WhatsApp: <WhatsAppIcon sx={{ fontSize: 18 }} />,
  Sms: <SmsOutlinedIcon sx={{ fontSize: 18 }} />,
  Authenticator: <PhoneAndroidOutlinedIcon sx={{ fontSize: 18 }} />,
};

const CHANNEL_LABEL = {
  Email: "Email",
  WhatsApp: "WhatsApp",
  Sms: "SMS",
  Authenticator: "Authenticator App",
};

const CHANNEL_DESCRIPTION = {
  Email: "Send the code to your email inbox",
  WhatsApp: "Send the code to your WhatsApp number",
  Sms: "Send the code as a text message",
  Authenticator: "Use the code from Google Authenticator",
};

// All channels we want to display in the picker. WhatsApp and Authenticator
// are currently implemented; Email and SMS are surfaced as "Coming Soon" so
// users know what's planned but can't pick them yet.
const ALL_CHANNELS = ["WhatsApp", "Authenticator", "Email", "Sms"];
const COMING_SOON_CHANNELS = new Set(["Email", "Sms"]);

// How long the user has to wait between OTP resends. Matches the
// forgot-password screen so the UX is consistent across all OTP flows.
const RESEND_COOLDOWN_SECONDS = 45;

const formatLocalTime = (isoUtc) => {
  if (!isoUtc) return "";
  try {
    const d = new Date(isoUtc);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const computeRemainingSeconds = (isoUtc) => {
  if (!isoUtc) return 0;
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
};

const formatRemaining = (seconds) => {
  if (seconds <= 0) return "less than a minute";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} second${s === 1 ? "" : "s"}`;
  if (s === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  return `${m} min ${s.toString().padStart(2, "0")} sec`;
};

const TwoFactorChallengeDialog = ({
  open,
  availableChannels = [],
  sentChannel,
  sentRecipient,
  expiresInMinutes = 10,
  initialLocked = false,
  initialLockoutEndsAt = "",
  initialError = "",
  onResend,
  onVerify,
  onCancel,
}) => {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [pickingChannel, setPickingChannel] = useState(null);
  const [switchingChannel, setSwitchingChannel] = useState(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [lockoutEndsAt, setLockoutEndsAt] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [maxAttempts, setMaxAttempts] = useState(null);
  const [, setNowTick] = useState(0);
  const tickRef = useRef(null);
  const [resendIn, setResendIn] = useState(0);
  const resendTimerRef = useRef(null);

  const clearResendTimer = () => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  };

  const startResendCooldown = () => {
    setResendIn(RESEND_COOLDOWN_SECONDS);
    clearResendTimer();
    resendTimerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearResendTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearResendTimer();
  }, []);

  useEffect(() => {
    if (open) {
      setOtp("");
      setVerifying(false);
      setResending(false);
      setPickingChannel(null);
      setSwitchingChannel(null);
      setError(initialError || "");
      setLocked(!!initialLocked);
      setLockoutEndsAt(initialLockoutEndsAt || "");
      setAttemptsLeft(null);
      setMaxAttempts(null);
      setResendIn(0);
      clearResendTimer();
    }
  }, [open, initialLocked, initialLockoutEndsAt, initialError]);

  // Live ticker only while locked, so the countdown stays accurate.
  useEffect(() => {
    if (locked && lockoutEndsAt) {
      tickRef.current = setInterval(() => setNowTick((t) => t + 1), 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
      };
    }
    return undefined;
  }, [locked, lockoutEndsAt]);

  const applyLockoutFromResult = (result) => {
    if (!result) return;
    const lp = result.lockout || result;
    if (typeof lp.attemptsLeft === "number") setAttemptsLeft(lp.attemptsLeft);
    if (typeof lp.maxAttempts === "number") setMaxAttempts(lp.maxAttempts);
    if (lp.lockoutEndsAt) setLockoutEndsAt(lp.lockoutEndsAt);
    if (lp.locked || result.locked) setLocked(true);
  };

  // The dialog has two steps:
  //   1. "select" — user picks a channel (no OTP sent yet)
  //   2. "enter"  — OTP has been sent to the picked channel; user enters it
  // We're in step 2 the moment the parent has a non-empty sentChannel.
  const showSelectStep = !sentChannel && !locked;

  const availableChannelMap = React.useMemo(() => {
    const map = new Map();
    (availableChannels || []).forEach((c) => map.set(c.channel, c));
    return map;
  }, [availableChannels]);

  const handlePickChannel = async (channel) => {
    if (COMING_SOON_CHANNELS.has(channel)) return;
    if (!availableChannelMap.has(channel)) return;
    setPickingChannel(channel);
    setError("");
    const result = await onResend(channel);
    setPickingChannel(null);
    if (result?.success) {
      // Authenticator codes come from the user's app, so there's nothing to
      // resend or rate-limit.
      if (channel !== "Authenticator") startResendCooldown();
      return;
    }
    const msg = result?.message || "Could not send the verification code.";
    setError(msg);
    applyLockoutFromResult(result);
  };

  const handleVerify = async () => {
    const trimmed = (otp || "").trim();
    if (trimmed.length < 4) {
      setError("Please enter the verification code.");
      return;
    }
    setError("");
    setVerifying(true);
    const result = await onVerify(trimmed);
    if (result?.success) return;

    setVerifying(false);
    setOtp("");
    const msg = result?.message || "Verification failed.";
    setError(msg);
    applyLockoutFromResult(result);
  };

  const handleResend = async () => {
    if (!sentChannel || locked || resendIn > 0) return;
    setResending(true);
    setError("");
    const result = await onResend(sentChannel);
    setResending(false);
    if (result?.success) {
      setAttemptsLeft(null);
      startResendCooldown();
      return;
    }
    const msg = result?.message || "Could not send the verification code.";
    setError(msg);
    applyLockoutFromResult(result);
  };

  const handleSwitchChannel = async (channel) => {
    if (channel === sentChannel || locked) return;
    if (COMING_SOON_CHANNELS.has(channel)) return;
    if (!availableChannelMap.has(channel)) return;
    setSwitchingChannel(channel);
    setError("");
    const result = await onResend(channel);
    setSwitchingChannel(null);
    if (result?.success) {
      setOtp("");
      setAttemptsLeft(null);
      if (channel !== "Authenticator") startResendCooldown();
      return;
    }
    const msg = result?.message || "Could not send the verification code.";
    setError(msg);
    applyLockoutFromResult(result);
  };

  const sentLabel = CHANNEL_LABEL[sentChannel] || sentChannel || "your channel";
  const remainingSeconds = locked && lockoutEndsAt ? computeRemainingSeconds(lockoutEndsAt) : 0;
  const localUnlockTime = formatLocalTime(lockoutEndsAt);
  const showAttemptsChip =
    !locked && typeof attemptsLeft === "number" && attemptsLeft >= 0 && error;

  const headerTitle = locked
    ? "Account Temporarily Locked"
    : showSelectStep
    ? "Two-Factor Authentication"
    : "Two-Factor Authentication";

  const isAuthenticatorStep = sentChannel === "Authenticator";

  const headerSubtitle = locked
    ? "Too many failed attempts. Please wait before trying again."
    : showSelectStep
    ? "Choose how to receive your verification code."
    : isAuthenticatorStep
    ? "Open your authenticator app and enter the current 6-digit code."
    : `We sent a ${expiresInMinutes}-minute code via ${sentLabel}${sentRecipient ? ` to ${sentRecipient}` : ""}.`;

  const renderChannelOption = (channel) => {
    const info = availableChannelMap.get(channel);
    const isComingSoon = COMING_SOON_CHANNELS.has(channel);
    const isPicking = pickingChannel === channel;
    const isAvailable = !!info && !isComingSoon;
    const recipient = info?.recipient || "";

    return (
      <Box
        key={channel}
        onClick={isAvailable && !pickingChannel ? () => handlePickChannel(channel) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          mb: 1,
          borderRadius: "12px",
          border: "1px solid",
          borderColor: isAvailable ? "#cdd5e7" : "#e6e6e6",
          backgroundColor: isAvailable ? "#fff" : "#FAFAFA",
          cursor: isAvailable && !pickingChannel ? "pointer" : "not-allowed",
          opacity: isAvailable ? 1 : 0.7,
          transition: "all 0.15s",
          "&:hover": isAvailable && !pickingChannel
            ? { borderColor: "#5e81f4", backgroundColor: "#F4F7FF" }
            : {},
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isAvailable ? "#EEF2FF" : "#EFEFEF",
            color: isAvailable ? "#5e81f4" : "#9e9e9e",
            flexShrink: 0,
          }}
        >
          {React.cloneElement(CHANNEL_ICON[channel], { sx: { fontSize: 20 } })}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1f2937" }}>
              {CHANNEL_LABEL[channel]}
            </Typography>
            {isComingSoon && (
              <Chip
                label="Coming Soon"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "#FFF1D6",
                  color: "#A35E00",
                }}
              />
            )}
            {!isComingSoon && !info && (
              <Chip
                label="Not enabled"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "#EEEEEE",
                  color: "#616161",
                }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {channel === "Authenticator"
              ? CHANNEL_DESCRIPTION[channel]
              : isAvailable && recipient
              ? `Send to ${recipient}`
              : CHANNEL_DESCRIPTION[channel]}
          </Typography>
        </Box>
        {isPicking ? (
          <CircularProgress size={18} />
        ) : isAvailable ? (
          <ChevronRightIcon sx={{ color: "#9aa3b2" }} />
        ) : null}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={verifying ? undefined : onCancel}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          background: locked
            ? "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)"
            : "linear-gradient(135deg, #5e81f4 0%, #4a6fd0 100%)",
          px: 3,
          pt: 4,
          pb: 3,
          textAlign: "center",
        }}
      >
        <Fade in={open} timeout={400}>
          <Box>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                color: "#fff",
              }}
            >
              {locked ? (
                <LockOutlinedIcon sx={{ fontSize: 48 }} />
              ) : (
                <SecurityOutlinedIcon sx={{ fontSize: 48 }} />
              )}
            </Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
              {headerTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
              {headerSubtitle}
            </Typography>

            {locked && (lockoutEndsAt || localUnlockTime) && (
              <Box
                sx={{
                  mt: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {localUnlockTime
                    ? `Try again at ${localUnlockTime}`
                    : "Try again later"}
                  {remainingSeconds > 0 ? ` · ${formatRemaining(remainingSeconds)} left` : ""}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
        {locked && error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
            {error}
          </Alert>
        )}

        {/* STEP 1: choose a channel */}
        {showSelectStep && (
          <>
            {error && !showAttemptsChip && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mb: 1 }}>
              {ALL_CHANNELS.map(renderChannelOption)}
            </Box>
            {availableChannels.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1, borderRadius: "10px" }}>
                No verified two-factor channels are available on your account.
                Please contact your administrator.
              </Alert>
            )}
            <Box sx={{ display: "flex", mt: 2 }}>
              <Button
                onClick={onCancel}
                color="inherit"
                disabled={!!pickingChannel}
                fullWidth
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}

        {/* STEP 2: enter the OTP code */}
        {!showSelectStep && (
          <>
            {showAttemptsChip && (
              <Alert
                severity={attemptsLeft <= 1 ? "error" : "warning"}
                sx={{ mb: 2, borderRadius: "10px" }}
              >
                {error}
                {typeof maxAttempts === "number"
                  ? ` (${attemptsLeft} of ${maxAttempts} attempts remaining)`
                  : ` (${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining)`}
              </Alert>
            )}

            <TextField
              autoFocus
              fullWidth
              label="Verification Code"
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
                if (error && !showAttemptsChip) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !locked) handleVerify();
              }}
              placeholder="6-digit code"
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 6,
                style: { letterSpacing: "0.4em", fontSize: 18, textAlign: "center" },
              }}
              error={!!error && !locked && !showAttemptsChip}
              helperText={!locked && !showAttemptsChip && error ? error : " "}
              disabled={locked}
              sx={{ mb: 1 }}
            />

            {!isAuthenticatorStep && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Didn't receive it?
                </Typography>
                <Button
                  size="small"
                  onClick={handleResend}
                  disabled={
                    resending || verifying || !sentChannel || locked || resendIn > 0
                  }
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {resending
                    ? "Sending..."
                    : resendIn > 0
                    ? `Resend code in ${resendIn}s`
                    : "Resend code"}
                </Button>
              </Box>
            )}

            {availableChannels.length > 1 && !locked && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Or use a different method:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {availableChannels.map((c) => {
                    const isCurrent = c.channel === sentChannel;
                    const isLoading = switchingChannel === c.channel;
                    const labelText =
                      c.channel === "Authenticator"
                        ? CHANNEL_LABEL[c.channel]
                        : `${CHANNEL_LABEL[c.channel] || c.channel}${c.recipient ? ` · ${c.recipient}` : ""}`;
                    return (
                      <Chip
                        key={c.channel}
                        icon={isLoading ? <CircularProgress size={14} /> : CHANNEL_ICON[c.channel]}
                        label={labelText}
                        onClick={isCurrent || verifying ? undefined : () => handleSwitchChannel(c.channel)}
                        color={isCurrent ? "primary" : "default"}
                        variant={isCurrent ? "filled" : "outlined"}
                        sx={{ fontWeight: 600 }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                onClick={onCancel}
                color="inherit"
                disabled={verifying}
                sx={{
                  flex: 1,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {locked ? "Close" : "Cancel"}
              </Button>
              {!locked && (
                <Button
                  onClick={handleVerify}
                  variant="contained"
                  disabled={verifying || otp.length === 0}
                  startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <VerifiedOutlinedIcon />}
                  sx={{
                    flex: 1,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "#5e81f4",
                    "&:hover": { backgroundColor: "#4a6fd0" },
                  }}
                >
                  {verifying ? "Verifying..." : "Verify & Sign in"}
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorChallengeDialog;
