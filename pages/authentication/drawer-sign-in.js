import React, { useState } from "react";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import getDeviceName from "@/components/utils/getDeviceName";
import DeviceNameDialog from "@/components/Authentication/DeviceNameDialog";

const DrawerSignIn = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    Email: "",
    Password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginNote, setLoginNote] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [loginResult, setLoginResult] = useState(null);

  const validate = () => {
    const errors = {};
    if (!formData.Email) {
      errors.Email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.Email)) {
      errors.Email = "Invalid email format";
    }

    if (!formData.Password) {
      errors.Password = "Password is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoginNote("");

    try {
      const response = await fetch(`${BASE_URL}/User/SignIn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          DeviceName: getDeviceName(),
        }),
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

      window.location.href = "/dashboard/reservation/";
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
    window.location.href = "/dashboard/reservation/";
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
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.statusCode !== 200) {
        toast.error(data?.message || "Could not save device name. Please try again.");
        return;
      }
      setDeviceDialogOpen(false);
      window.location.href = "/dashboard/reservation/";
    } catch {
      toast.error("Could not save device name. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Grid container sx={{ height: '80vh' }}>
      <Grid item xs={12} display="flex" alignItems="center" justifyContent="center">
        <img src="/images/DBlogo.png" alt="Logo" className="black-logo" />
      </Grid>
      <Grid item xs={12}>
        {loginNote && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loginNote}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Email"
          name="Email"
          size="small"
          value={formData.Email}
          onChange={handleInputChange}
          error={!!formErrors.Email}
          helperText={formErrors.Email}
          margin="normal"
        />
        <TextField
          fullWidth
          size="small"
          label="Password"
          name="Password"
          type={showPassword ? "text" : "password"}
          value={formData.Password}
          onChange={handleInputChange}
          error={!!formErrors.Password}
          helperText={formErrors.Password}
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          style={{ marginTop: "16px" }}
        >
          Sign In
        </Button>
      </Grid>
      <DeviceNameDialog
        open={deviceDialogOpen}
        value={deviceNameInput}
        onChange={setDeviceNameInput}
        onCancel={handleDeviceDialogCancel}
        onConfirm={handleDeviceDialogConfirm}
      />
    </Grid>
  );
};

export default DrawerSignIn;
