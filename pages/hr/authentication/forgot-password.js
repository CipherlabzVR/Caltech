import React, { useState } from "react";
import Link from "next/link";
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Email, ArrowBack } from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email }),
      });

      const responseData = await response.json();
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS"
        );

      if (isSuccess) {
        toast.success("OTP has been sent to your email");
        setOtpSent(true);
      } else {
        toast.error(responseData.message || responseData.Message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, OTP: otp }),
      });

      const responseData = await response.json();
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS"
        );

      if (isSuccess) {
        toast.success("OTP verified successfully");
      } else {
        toast.error(responseData.message || responseData.Message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/hr/HRAuthentication/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email: email,
          OTP: otp,
          NewPassword: newPassword,
          ConfirmPassword: confirmPassword,
        }),
      });

      const responseData = await response.json();
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS"
        );

      if (isSuccess) {
        toast.success("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/hr/authentication/login");
        }, 2000);
      } else {
        toast.error(responseData.message || responseData.Message || "Password reset failed");
      }
    } catch (error) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
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
            maxWidth: 600,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            backgroundColor: "#fff",
            p: 4,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Link
              href="/hr/authentication/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#1976d2",
                textDecoration: "none",
                marginBottom: 2,
              }}
            >
              <ArrowBack sx={{ mr: 1 }} />
              Back to Login
            </Link>

            <Typography variant="h5" fontWeight={700} mb={3}>
              Forgot Password
            </Typography>

            {!otpSent ? (
              <Box component="form" onSubmit={handleSendOTP}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

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
                  {loading ? <CircularProgress size={24} /> : "Send OTP"}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleResetPassword}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="OTP (6 digits)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  inputProps={{ maxLength: 6 }}
                  helperText="Enter the 6-digit OTP sent to your email"
                />

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  sx={{ mt: 2, mb: 2 }}
                >
                  Verify OTP
                </Button>

                <TextField
                  fullWidth
                  margin="normal"
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Password must be at least 6 characters"
                />

                <TextField
                  fullWidth
                  margin="normal"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

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
                  {loading ? <CircularProgress size={24} /> : "Reset Password"}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Box>
    </>
  );
}

