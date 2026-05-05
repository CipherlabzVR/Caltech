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
import { Email, Lock, Visibility, VisibilityOff, Person } from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import "react-toastify/dist/ReactToastify.css";
import getDeviceName from "@/components/utils/getDeviceName";
import { getDeviceIdentity } from "@/components/utils/getDeviceId";
import DeviceNameDialog from "@/components/Authentication/DeviceNameDialog";
import { touchSessionActivity } from "@/components/utils/logoutUser";

const HRLoginForm = () => {
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginNote, setLoginNote] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [loginResult, setLoginResult] = useState(null);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const usernameOrEmail = data.get("usernameOrEmail");
    const password = data.get("password");

    if (!usernameOrEmail || !password) {
      setShowError(true);
      return;
    }

    setLoginNote("");
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UsernameOrEmail: usernameOrEmail,
          Password: password,
          DeviceName: getDeviceName(),
        }),
      });

      const responseData = await response.json();

      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess =
        response.ok && (
          statusCode === 200 ||
          statusCode === "200" ||
          statusCode === "SUCCESS" ||
          (statusCode === undefined && !responseData.message && !responseData.Message)
        );

      if (!isSuccess) {
        const errorMsg = responseData.message || responseData.Message || "Invalid username or password";
        throw new Error(errorMsg);
      }

      const result = responseData.result || responseData.Result;

      localStorage.setItem("token", result.accessToken || result.AccessToken);
      localStorage.setItem("user", result.email || result.Email);
      localStorage.setItem("userid", result.id || result.Id);
      localStorage.setItem("name", result.firstName || result.FirstName);
      localStorage.setItem("type", result.userType || result.UserType);
      localStorage.setItem("warehouse", result.warehouseId || result.WarehouseId);
      localStorage.setItem("company", result.companyId || result.CompanyId);
      localStorage.setItem("role", result.userRole || result.UserRole);
      localStorage.setItem("isPasswordReset", result.isPasswordReset || result.IsPasswordReset || false);

      sessionStorage.removeItem("holidayGreetingShown");
      sessionStorage.setItem("justLoggedIn", "true");
      touchSessionActivity();

      const needsPasswordReset = result.isPasswordReset === false || result.IsPasswordReset === false;
      const isNewDevice = result.isNewDevice || result.IsNewDevice;
      const redirectPath = needsPasswordReset ? "/hr/authentication/first-time-password-reset" : "/hr";

      if (isNewDevice) {
        setLoginResult(result);
        setPendingRedirect(redirectPath);
        setDeviceNameInput(getDeviceName());
        setDeviceDialogOpen(true);
        if (needsPasswordReset) {
          toast.info("Please reset your password on first login");
        }
        return;
      }

      if (needsPasswordReset) {
        toast.info("Please reset your password on first login");
        router.push("/hr/authentication/first-time-password-reset");
      } else {
        toast.success("Login successful!");
        router.push("/hr");
      }
    } catch (error) {
      const message = error.message || "Login failed";

      if (message.includes("registered devices") || message.includes("contact admin")) {
        setLoginNote(message);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceDialogCancel = () => {
    setDeviceDialogOpen(false);
    touchSessionActivity();
    router.push(pendingRedirect || "/hr");
  };

  const handleDeviceDialogConfirm = async () => {
    const trimmed = deviceNameInput.trim();
    if (!trimmed) return;

    const token = loginResult?.accessToken || loginResult?.AccessToken;
    const deviceRowId = loginResult?.currentLoggedInDeviceId ?? loginResult?.CurrentLoggedInDeviceId;
    const isRenameSuccess = (data) => {
      const sc = data?.statusCode ?? data?.StatusCode;
      return Number(sc) === 200;
    };

    if (token) {
      try {
        const identity = await getDeviceIdentity();
        const idQuery =
          deviceRowId != null
            ? `&loggedInDeviceIpId=${encodeURIComponent(String(deviceRowId))}`
            : "";
        const response = await fetch(
          `${BASE_URL}/User/RenameCurrentDevice?newDeviceName=${encodeURIComponent(trimmed)}` +
            `&deviceIdentifier=${encodeURIComponent(identity.deviceIdentifier || "")}` +
            (identity.deviceFingerprint
              ? `&deviceFingerprint=${encodeURIComponent(identity.deviceFingerprint)}`
              : "") +
            (identity.browserInstanceId
              ? `&browserInstanceId=${encodeURIComponent(identity.browserInstanceId)}`
              : "") +
            idQuery,
          {
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
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !isRenameSuccess(data)) {
          toast.error(data?.message || "Could not save device name. You can continue anyway.");
        }
      } catch {
        toast.error("Could not save device name. You can continue anyway.");
      }
    }

    setDeviceDialogOpen(false);
    touchSessionActivity();
    router.push(pendingRedirect || "/hr");
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
            backgroundColor: "#1976d2",
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
            HR Portal
          </Typography>
          <Typography variant="body2">
            Log in to access the HR Management System
          </Typography>
        </Grid>

        <Grid item xs={12} md={7} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>
            HR Login
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
              name="usernameOrEmail"
              label="Username or Email"
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
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
              required
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
                href="/hr/authentication/forgot-password"
                style={{
                  fontSize: 14,
                  color: "#1976d2",
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
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.3,
                fontWeight: 600,
                fontSize: 16,
                borderRadius: "8px",
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              mt={3}
            >
              <strong>HR Admin Credentials:</strong><br />
              Username: hradmin<br />
              Password: HRAdmin@123
            </Typography>
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
    </Box>
  );
};

export default HRLoginForm;
