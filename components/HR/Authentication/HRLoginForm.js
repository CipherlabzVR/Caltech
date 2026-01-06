import React, { useState } from "react";
import Link from "next/link";
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
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

const HRLoginForm = () => {
  const [showError, setShowError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          UsernameOrEmail: usernameOrEmail, 
          Password: password 
        }),
      });

      const responseData = await response.json();
      
      // Check for success
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

      // Set flag for holiday greeting to show on fresh login
      sessionStorage.removeItem("holidayGreetingShown");
      sessionStorage.setItem("justLoggedIn", "true");

      // Check if first-time password reset is needed
      if (result.isPasswordReset === false || result.IsPasswordReset === false) {
        toast.info("Please reset your password on first login");
        router.push("/hr/authentication/first-time-password-reset");
      } else {
        toast.success("Login successful!");
        router.push("/hr");
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
    </Box>
  );
};

export default HRLoginForm;

