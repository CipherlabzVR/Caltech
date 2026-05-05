import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  WhatsApp,
  MarkEmailRead,
  Sms as SmsIcon,
  LockClock,
} from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

// 3-step flow:
//   STEP_REQUEST  -> enter the account email AND pick a delivery channel on
//                    the same screen (only WhatsApp is enabled today; Email
//                    and SMS are shown as "Coming Soon"). One "Send OTP"
//                    button delivers the code to the matching contact detail
//                    on the user's profile.
//   STEP_OTP      -> enter the 6-digit code, with attempts-left + lockout UX
//   STEP_PASSWORD -> set the new password
const STEP_REQUEST = 0;
const STEP_OTP = 1;
const STEP_PASSWORD = 2;

const ALL_CHANNELS = ["WhatsApp", "Email", "Sms"];
const COMING_SOON_CHANNELS = new Set(["Email", "Sms"]);
const CHANNEL_LABEL = {
  WhatsApp: "WhatsApp",
  Email: "Email",
  Sms: "SMS",
};
const CHANNEL_ICON = {
  WhatsApp: <WhatsApp />,
  Email: <MarkEmailRead />,
  Sms: <SmsIcon />,
};

const passwordRules = [
  { test: (v) => v.length >= 8, label: "At least 8 characters" },
  { test: (v) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v) => /\d/.test(v), label: "One number" },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: "One special character" },
];

const RESEND_COOLDOWN_SECONDS = 45;

// Pull structured lockout fields from the API result so the UI can show
// "X attempts left" and the precise "try again at HH:MM" time.
const isLockoutMessage = (msg) => {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("too many")
    || lower.includes("try again in")
    || lower.includes("temporarily locked")
  );
};

const extractLockoutInfo = (data, fallbackMsg) => {
  // Backend wraps the lockout payload in two shapes:
  //   - VerifyForgotPasswordOtp / ResetPasswordWithOtp -> data.result = lockout
  //   - SendForgotPasswordOtp success                  -> data.result.lockout
  const r = data?.result || {};
  const inner = r?.lockout || r;
  return {
    locked: !!inner?.locked || isLockoutMessage(fallbackMsg),
    lockoutEndsAt: inner?.lockoutEndsAtUtc || "",
    attemptsLeft:
      typeof inner?.attemptsLeft === "number" ? inner.attemptsLeft : null,
    maxAttempts:
      typeof inner?.maxAttempts === "number" ? inner.maxAttempts : null,
  };
};

const ForgotPasswordForm = () => {
  const router = useRouter();

  const [step, setStep] = useState(STEP_REQUEST);
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("WhatsApp");

  // OTP step
  const [otp, setOtp] = useState("");
  const [recipient, setRecipient] = useState("");

  // Password step
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submission / messaging state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState(false);

  // Lockout state (mirrors the 2FA dialog payload)
  const [locked, setLocked] = useState(false);
  const [lockoutEndsAt, setLockoutEndsAt] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [maxAttempts, setMaxAttempts] = useState(null);
  const [lockoutNowTick, setLockoutNowTick] = useState(0);

  const [resendIn, setResendIn] = useState(0);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // Re-render every second while locked so the countdown ticks.
  useEffect(() => {
    if (!locked || !lockoutEndsAt) return undefined;
    const id = setInterval(() => setLockoutNowTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [locked, lockoutEndsAt]);

  const startResendCooldown = () => {
    setResendIn(RESEND_COOLDOWN_SECONDS);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearInterval(resendTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

  const applyLockoutFromResponse = (data, fallbackMsg) => {
    const info = extractLockoutInfo(data, fallbackMsg);
    setLocked(info.locked);
    setLockoutEndsAt(info.lockoutEndsAt);
    setAttemptsLeft(info.attemptsLeft);
    setMaxAttempts(info.maxAttempts);
    return info;
  };

  const clearLockoutState = () => {
    setLocked(false);
    setLockoutEndsAt("");
    setAttemptsLeft(null);
    setMaxAttempts(null);
  };

  const sendOtp = async ({ silent = false } = {}) => {
    setError("");
    setInfo("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/User/SendForgotPasswordOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email.trim(), Channel: channel }),
      });
      const data = await response.json().catch(() => ({}));
      const ok = data?.statusCode === 200;
      const message = data?.message || "";

      if (!ok) {
        const msg = message || "Could not send the OTP. Please try again.";
        applyLockoutFromResponse(data, msg);
        setError(msg);
        if (!silent) toast.error(msg);
        return false;
      }

      // Success path: clear any previous lockout, capture the masked recipient.
      clearLockoutState();
      const result = data?.result || {};
      if (result.recipient) setRecipient(result.recipient);
      // The server may also include a non-locked lockout payload so we can
      // surface attempts-left even on a successful send.
      if (result.lockout) {
        applyLockoutFromResponse(data, "");
        setLocked(false);
      }

      setInfo(message || `An OTP has been sent to your registered ${CHANNEL_LABEL[channel]} number.`);
      if (!silent) {
        toast.success(`OTP sent to your ${CHANNEL_LABEL[channel]}.`);
      }
      startResendCooldown();
      return true;
    } catch (err) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      if (!silent) toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // STEP_REQUEST submit -> validate email, send the OTP via the picked
  // channel (delivered to the matching contact detail on the user's
  // profile), and advance to the OTP step.
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (COMING_SOON_CHANNELS.has(channel)) {
      setError("Please choose a delivery channel that is currently available.");
      return;
    }

    const ok = await sendOtp();
    if (ok) {
      setOtp("");
      setStep(STEP_OTP);
    }
  };

  // Picks a channel card on the request step. Coming-soon channels are no-ops.
  const handlePickChannel = (selected) => {
    if (COMING_SOON_CHANNELS.has(selected)) return;
    setChannel(selected);
    setError("");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (locked) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/User/VerifyForgotPasswordOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email.trim(), Otp: otp.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      const ok = data?.statusCode === 200;
      const message = data?.message || "";

      if (!ok) {
        const msg = message || "Invalid OTP. Please try again.";
        const lockInfo = applyLockoutFromResponse(data, msg);
        setError(msg);
        toast.error(msg);
        // Always wipe the OTP field on a wrong attempt so the user can't
        // accidentally re-submit the same wrong code.
        setOtp("");
        if (lockInfo.locked) {
          // Stay on this step so the lockout UI shows the countdown.
        }
        return;
      }

      clearLockoutState();
      setInfo("");
      setStep(STEP_PASSWORD);
    } catch (err) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const allRulesPass = passwordRules.every((rule) => rule.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRulesPass) {
      setError("Please make sure your password meets all the requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/User/ResetPasswordWithOtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email.trim(),
          Otp: otp.trim(),
          Password: password,
          ConfirmPassword: confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const ok = data?.statusCode === 200;
      const message = data?.message || "";

      if (!ok) {
        const msg = message || "Could not reset the password.";
        const lockInfo = applyLockoutFromResponse(data, msg);
        setError(msg);
        toast.error(msg);
        // If the OTP is what failed (locked or attemptsLeft present), bounce
        // back to the OTP step so the lockout/attempts UI is in scope.
        if (lockInfo.locked || lockInfo.attemptsLeft !== null) {
          setOtp("");
          setStep(STEP_OTP);
        }
        return;
      }

      setSuccess(true);
      toast.success("Password reset successfully. You can now sign in.");
      setTimeout(() => {
        router.push("/authentication/sign-in/");
      }, 1800);
    } catch (err) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setError("");
    setInfo("");
    if (step === STEP_PASSWORD) {
      setStep(STEP_OTP);
    } else if (step === STEP_OTP) {
      setStep(STEP_REQUEST);
      setOtp("");
      clearLockoutState();
    }
  };

  // ---- Lockout countdown helpers ----
  const renderLockoutBox = () => {
    if (!locked || !lockoutEndsAt) return null;
    const endsAt = new Date(lockoutEndsAt);
    if (Number.isNaN(endsAt.getTime())) return null;

    const localTime = endsAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const localDate = endsAt.toLocaleDateString();
    const remainingMs = Math.max(0, endsAt.getTime() - Date.now());
    const remainingMin = Math.floor(remainingMs / 60000);
    const remainingSec = Math.floor((remainingMs % 60000) / 1000);
    const remainingLabel =
      remainingMin > 0
        ? `${remainingMin} min ${remainingSec.toString().padStart(2, "0")} sec`
        : `${remainingSec} second${remainingSec === 1 ? "" : "s"}`;

    // Reference lockoutNowTick so this re-renders every second while locked.
    void lockoutNowTick;
    return (
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: "10px",
          backgroundColor: "#FFF4F4",
          border: "1px solid #F8C8C8",
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        <LockClock sx={{ color: "#B71C1C", mt: 0.25 }} fontSize="small" />
        <Box>
          <Typography
            sx={{ fontSize: "13px", color: "#B71C1C", fontWeight: 700 }}
          >
            Account temporarily locked.
          </Typography>
          <Typography sx={{ fontSize: "13px", color: "#B71C1C" }}>
            You can try again at <strong>{localTime}</strong> ({localDate}).
          </Typography>
          {remainingMs > 0 && (
            <Typography sx={{ fontSize: "12px", color: "#7F1D1D", mt: 0.25 }}>
              Time remaining: {remainingLabel}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderAttemptsLeft = () => {
    if (locked) return null;
    if (typeof attemptsLeft !== "number") return null;
    if (attemptsLeft <= 0) return null;
    return (
      <Alert
        severity={attemptsLeft === 1 ? "error" : "warning"}
        sx={{ mb: 2, borderRadius: "10px" }}
      >
        {attemptsLeft === 1
          ? "1 attempt left before your account is temporarily locked."
          : `${attemptsLeft} attempts left.`}
      </Alert>
    );
  };

  // ---- Channel cards (mirrors the 2FA dialog look) ----
  // On the request step the cards are *selectable*: clicking one highlights
  // it and the actual OTP send happens when the user hits the Send button.
  const renderChannelOption = (ch) => {
    const isComingSoon = COMING_SOON_CHANNELS.has(ch);
    const isAvailable = !isComingSoon;
    const isSelected = channel === ch && isAvailable;

    return (
      <Box
        key={ch}
        onClick={isAvailable && !submitting ? () => handlePickChannel(ch) : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          mb: 1,
          borderRadius: "12px",
          border: "2px solid",
          borderColor: isSelected
            ? "#5e81f4"
            : isAvailable
            ? "#cdd5e7"
            : "#e6e6e6",
          backgroundColor: isSelected
            ? "#F4F7FF"
            : isAvailable
            ? "#fff"
            : "#FAFAFA",
          cursor: isAvailable && !submitting ? "pointer" : "not-allowed",
          opacity: isAvailable ? 1 : 0.7,
          transition: "all 0.15s",
          "&:hover":
            isAvailable && !submitting && !isSelected
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
          {React.cloneElement(CHANNEL_ICON[ch], { sx: { fontSize: 20 } })}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1f2937" }}>
              {CHANNEL_LABEL[ch]}
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
            {isSelected && (
              <Chip
                label="Selected"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "10px",
                  fontWeight: 700,
                  backgroundColor: "#5e81f4",
                  color: "#fff",
                }}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 0.25 }}
          >
            {isComingSoon
              ? "Not available yet — check back soon."
              : "Send the code to the WhatsApp number on your profile."}
          </Typography>
        </Box>
      </Box>
    );
  };

  const headerTitle =
    step === STEP_REQUEST
      ? "Forgot Password?"
      : step === STEP_OTP
      ? "Verify OTP"
      : "Set New Password";

  const headerSubtitle =
    step === STEP_REQUEST
      ? "Enter your account email and choose how to receive your one-time code."
      : step === STEP_OTP
      ? `Enter the 6-digit code we sent via ${CHANNEL_LABEL[channel]}.`
      : "Choose a strong password to keep your account secure.";

  const HeaderIcon = step === STEP_OTP ? WhatsApp : MarkEmailRead;

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
          maxWidth: 860,
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
          <HeaderIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
          <Typography variant="h4" fontWeight={700} mb={1}>
            {headerTitle}
          </Typography>
          <Typography variant="body2">{headerSubtitle}</Typography>
        </Grid>

        <Grid item xs={12} md={7} sx={{ p: 4 }}>
          {error && !locked && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {info && step !== STEP_PASSWORD && !locked && (
            <Alert severity="info" sx={{ mb: 2 }} onClose={() => setInfo("")}>
              {info}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset successful. Redirecting to sign in...
            </Alert>
          )}

          {/* STEP 1: ENTER ACCOUNT EMAIL + PICK DELIVERY CHANNEL */}
          {step === STEP_REQUEST && (
            <Box component="form" noValidate onSubmit={handleRequestSubmit}>
              {renderLockoutBox()}
              {renderAttemptsLeft()}

              <Typography variant="body2" color="text.secondary" mb={2}>
                Enter your account email, then choose how to receive your
                one-time code. The OTP will be sent to the matching contact
                detail on your profile.
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || locked}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, display: "block", mt: 2, mb: 1 }}
              >
                Send the OTP via
              </Typography>
              <Box sx={{ mb: 1 }}>
                {ALL_CHANNELS.map(renderChannelOption)}
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting || locked}
                sx={primaryBtnSx}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  `Send OTP via ${CHANNEL_LABEL[channel]}`
                )}
              </Button>
            </Box>
          )}

          {/* STEP 3: ENTER OTP */}
          {step === STEP_OTP && (
            <Box component="form" noValidate onSubmit={handleOtpSubmit}>
              {renderLockoutBox()}
              {renderAttemptsLeft()}

              <Typography variant="body2" color="text.secondary" mb={2}>
                We sent a 6-digit code via{" "}
                <strong>{CHANNEL_LABEL[channel]}</strong>
                {recipient ? (
                  <>
                    {" "}to <strong>{recipient}</strong>
                  </>
                ) : (
                  <> to the contact on your profile</>
                )}
                .
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                name="otp"
                label="6-digit OTP"
                variant="outlined"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={submitting || locked}
                inputProps={{
                  inputMode: "numeric",
                  maxLength: 6,
                  style: { letterSpacing: 6, fontSize: 22, textAlign: "center" },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting || otp.length !== 6 || locked}
                sx={primaryBtnSx}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  size="small"
                  onClick={goBack}
                  disabled={submitting}
                  sx={{ textTransform: "none", color: "#5e81f4" }}
                >
                  Change email or channel
                </Button>
                <Button
                  size="small"
                  onClick={() => sendOtp()}
                  disabled={submitting || resendIn > 0 || locked}
                  sx={{ textTransform: "none", color: "#5e81f4" }}
                >
                  {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 4: SET NEW PASSWORD */}
          {step === STEP_PASSWORD && (
            <Box component="form" noValidate onSubmit={handlePasswordSubmit}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Choose a new password for <strong>{email.trim()}</strong>.
              </Typography>

              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting || success}
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

              <TextField
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm New Password"
                type={showConfirm ? "text" : "password"}
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting || success}
                error={confirmPassword.length > 0 && !passwordsMatch}
                helperText={
                  confirmPassword.length > 0 && !passwordsMatch
                    ? "Passwords do not match"
                    : " "
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mt: 0.5, mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Password requirements:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {passwordRules.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <Typography
                        key={rule.label}
                        component="li"
                        variant="caption"
                        sx={{ color: ok ? "success.main" : "text.secondary" }}
                      >
                        {rule.label}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={
                  submitting || success || !allRulesPass || !passwordsMatch
                }
                sx={primaryBtnSx}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Box display="flex" justifyContent="flex-start" mt={2}>
                <Button
                  size="small"
                  onClick={goBack}
                  disabled={submitting || success}
                  sx={{ textTransform: "none", color: "#5e81f4" }}
                >
                  Back to OTP
                </Button>
              </Box>
            </Box>
          )}

          <Box display="flex" justifyContent="center" mt={3}>
            <Link
              href="/authentication/sign-in/"
              style={{
                fontSize: 14,
                color: "#5e81f4",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ArrowBack fontSize="small" /> Back to Sign in
            </Link>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const primaryBtnSx = {
  mt: 2,
  py: 1.3,
  fontWeight: 600,
  fontSize: 16,
  borderRadius: "8px",
  backgroundColor: "#5e81f4",
  "&:hover": { backgroundColor: "#4a6fd0" },
};

export default ForgotPasswordForm;
