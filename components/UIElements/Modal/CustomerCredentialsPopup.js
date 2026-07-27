import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ContentCopy,
  Visibility,
  VisibilityOff,
  WhatsApp,
  Email as EmailIcon,
  Sms,
  Close,
  CheckCircle,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

function normalizeReservedCustomerCredentials(raw) {
  if (!raw) return null;
  const reservationId = raw.reservationId ?? raw.ReservationId;
  if (reservationId == null || reservationId === "") return null;
  return {
    reservationId,
    userName: raw.userName ?? raw.UserName ?? "",
    email: raw.email ?? raw.Email ?? "",
    mobileNo: raw.mobileNo ?? raw.MobileNo ?? "",
    customerName: raw.customerName ?? raw.CustomerName ?? "",
    tempPassword: raw.tempPassword ?? raw.TempPassword ?? "",
  };
}

/**
 * Reusable popup that shows the credentials freshly generated for a reserved
 * customer and lets the operator deliver them via WhatsApp (wired) or via
 * Email/SMS (placeholders for the next iteration).
 *
 * Props:
 *   open, onClose          - dialog state
 *   credentials            - { reservationId, userName, tempPassword,
 *                              email, mobileNo, customerName }
 *   variant                - "fresh" (just generated, password visible) |
 *                            "resend" (re-use stored password when shown; otherwise send rotates it)
 */
export default function CustomerCredentialsPopup({
  open,
  onClose,
  credentials,
  variant = "fresh",
}) {
  const [showPassword, setShowPassword] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentChannel, setSentChannel] = useState(null);
  const [error, setError] = useState("");
  const [liveCreds, setLiveCreds] = useState(() =>
    normalizeReservedCustomerCredentials(credentials)
  );

  React.useEffect(() => {
    setLiveCreds(normalizeReservedCustomerCredentials(credentials));
    setSentChannel(null);
    setError("");
  }, [credentials, open]);

  if (!liveCreds) return null;

  const copy = (label, value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const sendVia = async (channel) => {
    setError("");
    if (channel !== "whatsapp") {
      setError(
        `${channel.toUpperCase()} delivery isn't enabled yet. Use WhatsApp for now.`
      );
      return;
    }
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const knownPassword = (liveCreds.tempPassword || "").trim();
      // Only rotate when we have no issued password (e.g. old rows or cleared field).
      // Otherwise WhatsApp would get a new password while the popup still showed the old one.
      const res = await fetch(`${BASE_URL}/ReservedCustomer/SendCredentials`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: liveCreds.reservationId,
          channel,
          regeneratePassword: !knownPassword,
          mobileNoOverride: liveCreds.mobileNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send credentials");
      }
      const newPwd = data?.result?.newPassword ?? data?.result?.NewPassword;
      if (newPwd) {
        setLiveCreds({ ...liveCreds, tempPassword: newPwd });
      }
      setSentChannel(channel);
      toast.success(`Credentials sent via ${channel}`);
    } catch (e) {
      setError(e.message || "Failed to send credentials");
      toast.error(e.message || "Failed to send credentials");
    } finally {
      setSending(false);
    }
  };

  const passwordValue = liveCreds.tempPassword || "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Customer Portal Login
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {liveCreds.customerName || "Reserved Customer"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {variant === "resend" && !passwordValue && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No password is available for this account in the system. Use
            WhatsApp below to generate a new password and send it.
          </Alert>
        )}

        {variant === "fresh" && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
            Login generated. Share these credentials with the customer.
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="Email (use this to sign in)"
            value={liveCreds.userName || liveCreds.email || ""}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title="Copy email">
                  <IconButton
                    onClick={() => copy("Email", liveCreds.userName || liveCreds.email)}
                    edge="end"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={passwordValue}
            placeholder={!passwordValue ? "(will be generated on send)" : ""}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Box>
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                  <Tooltip title="Copy password">
                    <span>
                      <IconButton
                        onClick={() => copy("Password", passwordValue)}
                        disabled={!passwordValue}
                        edge="end"
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ),
            }}
          />

          {liveCreds.mobileNo && (
            <TextField
              label="Mobile (delivery target)"
              value={liveCreds.mobileNo}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          )}
        </Stack>

        <Divider sx={{ my: 3 }}>Send Credentials</Divider>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            onClick={() => sendVia("whatsapp")}
            disabled={sending}
            variant="contained"
            startIcon={
              sending && sentChannel == null ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <WhatsApp />
              )
            }
            sx={{
              backgroundColor: "#25D366",
              "&:hover": { backgroundColor: "#1ebe57" },
              minWidth: 140,
            }}
          >
            WhatsApp
          </Button>
          <Tooltip title="Email delivery coming soon">
            <span>
              <Button
                onClick={() => sendVia("email")}
                variant="outlined"
                startIcon={<EmailIcon />}
                disabled
                sx={{ minWidth: 140 }}
              >
                Email
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="SMS delivery coming soon">
            <span>
              <Button
                onClick={() => sendVia("sms")}
                variant="outlined"
                startIcon={<Sms />}
                disabled
                sx={{ minWidth: 140 }}
              >
                SMS
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {sentChannel && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
            Credentials sent via {sentChannel}.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
