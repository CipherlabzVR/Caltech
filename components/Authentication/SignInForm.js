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
import DeviceNameDialog from "@/components/Authentication/DeviceNameDialog";

const SignInForm = () => {
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginNote, setLoginNote] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [loginResult, setLoginResult] = useState(null);
  const router = useRouter();

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

    try {
      const response = await fetch(`${BASE_URL}/User/SignIn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password, DeviceName: getDeviceName() }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Login failed");
      }

      const result = responseData.result;

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
    } catch (error) {
      const message = error.message || "Login failed";

      if (message.includes("registered devices") || message.includes("contact admin")) {
        setLoginNote(message);
        return;
      }

      toast.error(message);
    }
  };

  const handleDeviceDialogCancel = () => {
    setDeviceDialogOpen(false);
    router.push("/");
    window.location.reload();
  };

  const handleDeviceDialogConfirm = async () => {
    const trimmed = deviceNameInput.trim();
    if (!trimmed || !loginResult) return;

    try {
      const response = await fetch(
        `${BASE_URL}/User/RenameCurrentDevice?newDeviceName=${encodeURIComponent(trimmed)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${loginResult.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ NewDeviceName: trimmed }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data?.message || "Could not save device name. You can continue anyway.");
      }
    } catch {
      toast.error("Could not save device name. You can continue anyway.");
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
              Login
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
    </Box>
  );
};

export default SignInForm;
